import numpy as np
import pandas as pd
from ast import literal_eval
import os
import logging
from typing import List, Optional, Tuple, Dict, Any, Union
import json
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_RECOMMENDATIONS = [
    "The Shawshank Redemption", "The Godfather", "The Dark Knight",
    "Pulp Fiction", "Inception", "The Matrix", "Interstellar"
]
SIMILARITY_THRESHOLD = 50  # Minimum confidence score for fuzzy matching
MAX_RECOMMENDATIONS = 20
DEFAULT_LIMIT = 10

# Type aliases
DataFrame = pd.DataFrame
NDArray = np.ndarray
Series = pd.Series

class RecommendationError(Exception):
    """Base exception for recommendation-related errors."""
    pass

class DataLoadError(RecommendationError):
    """Raised when there's an error loading or processing data."""
    pass

class ModelBuildError(RecommendationError):
    """Raised when there's an error building the recommendation model."""
    pass

def safe_literal_eval(x: str) -> Any:
    """Safely evaluate a string containing a Python literal."""
    try:
        return literal_eval(x) if isinstance(x, str) else x
    except (ValueError, SyntaxError):
        return []

def load_data() -> DataFrame:
    """Load and merge the TMDB datasets with error handling."""
    try:
        logger.info("Loading TMDB datasets...")
        
        # Get the directory of the current script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Define absolute paths to the CSV files
        credits_path = os.path.join(script_dir, "tmdb_5000_credits.csv")
        movies_path = os.path.join(script_dir, "tmdb_5000_movies.csv")
        
        logger.info(f"Looking for CSV files at:\n- {credits_path}\n- {movies_path}")
        
        # Check if CSV files exist
        if not os.path.exists(credits_path):
            raise DataLoadError(f"File not found: {credits_path}")
        if not os.path.exists(movies_path):
            raise DataLoadError(f"File not found: {movies_path}")
        
        # Load and merge datasets
        logger.info("Reading CSV files...")
        credits_df = pd.read_csv(credits_path)
        movies_df = pd.read_csv(movies_path)
        
        if credits_df.empty:
            raise DataLoadError(f"Credits CSV is empty: {credits_path}")
        if movies_df.empty:
            raise DataLoadError(f"Movies CSV is empty: {movies_path}")
            
        logger.info(f"CSV files loaded. Credits: {len(credits_df)} rows, Movies: {len(movies_df)} rows")
        
        # Clean and merge data
        credits_df = credits_df.rename(columns={
            'movie_id': 'id',
            'title': 'movie_title'  # Rename to avoid conflict
        })
        logger.info("Merging datasets...")
        
        # Merge and clean up duplicate columns
        df = pd.merge(
            movies_df,
            credits_df[['id', 'cast', 'crew']],  # Only take needed columns from credits
            on='id',
            how='left'
        )
        
        # Ensure we have a clean title column
        if 'title' not in df.columns and 'original_title' in df.columns:
            df['title'] = df['original_title']
            
        logger.info(f"Final columns after merge: {df.columns.tolist()}")
        
        if df.empty:
            raise DataLoadError("Failed to merge datasets - no common IDs found")
            
        logger.info(f"Successfully merged datasets. Total movies: {len(df)}")
        return df
        
    except pd.errors.EmptyDataError as e:
        error_msg = f"CSV file is empty or malformed: {str(e)}"
        logger.error(error_msg)
        raise DataLoadError(error_msg)
    except pd.errors.ParserError as e:
        error_msg = f"Error parsing CSV file: {str(e)}"
        logger.error(error_msg)
        raise DataLoadError(error_msg)
    except Exception as e:
        error_msg = f"Unexpected error loading data: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise DataLoadError(error_msg) from e

def extract_features(df: DataFrame) -> DataFrame:
    """Extract and process features from the raw DataFrame."""
    if df.empty:
        return df
        
    df = df.copy()
    
    # Safely evaluate string representations of lists/dicts
    for col in ['cast', 'crew', 'keywords', 'genres']:
        if col in df.columns:
            df[col] = df[col].apply(safe_literal_eval)
    
    # Extract director
    df['director'] = df['crew'].apply(
        lambda x: next((i["name"] for i in x if isinstance(i, dict) and i.get("job") == "Director"), "")
    )
    
    # Extract top cast members
    for col in ['cast', 'keywords', 'genres']:
        df[col] = df[col].apply(
            lambda x: [i.get("name", "") for i in x[:3]] if isinstance(x, list) else []
        )
    
    # Clean text data
    text_columns = ['cast', 'keywords', 'director', 'genres', 'overview', 'title']
    for col in text_columns:
        if col in df.columns:
            df[col] = df[col].apply(
                lambda x: " ".join(str(i).lower().replace(" ", "") for i in x) 
                if isinstance(x, list) 
                else str(x).lower().replace(" ", "") if pd.notnull(x) 
                else ""
            )
    
    return df

def build_recommendation_model(df: DataFrame) -> Tuple[DataFrame, NDArray, Series]:
    """Build the recommendation model with error handling."""
    if df.empty:
        raise ModelBuildError("Cannot build model with empty DataFrame")
    
    try:
        logger.info("Building recommendation model...")
        df = extract_features(df)
        
        # Create feature soup
        df['soup'] = (
            df['keywords'] + " " + 
            df['cast'] + " " + 
            df['director'] + " " + 
            df['genres']
        )
        
        # Vectorize features
        from sklearn.feature_extraction.text import CountVectorizer
        count_vectorizer = CountVectorizer(stop_words="english")
        count_matrix = count_vectorizer.fit_transform(df['soup'])
        
        # Calculate similarity
        from sklearn.metrics.pairwise import cosine_similarity
        cosine_sim = cosine_similarity(count_matrix, count_matrix)
        
        # Create indices
        df = df.reset_index(drop=True)
        indices = pd.Series(df.index, index=df['title']).drop_duplicates()
        
        logger.info("Successfully built recommendation model")
        return df, cosine_sim, indices
        
    except Exception as e:
        raise ModelBuildError(f"Error building recommendation model: {str(e)}") from e

def get_similar_movies(
    title: str,
    df: DataFrame,
    cosine_sim: NDArray,
    indices: Series,
    limit: int = DEFAULT_LIMIT
) -> List[str]:
    """
    Get similar movies based on content similarity.
    
    Args:
        title: Title of the movie to find similar movies for
        df: DataFrame containing movie data
        cosine_sim: Precomputed cosine similarity matrix
        indices: Series mapping movie titles to indices
        limit: Maximum number of recommendations to return (default: 10)
        
    Returns:
        List of similar movie titles
    """
    try:
        idx = indices[title]
        # Get similarity scores for all movies
        sim_scores = list(enumerate(cosine_sim[idx]))
        # Sort by similarity score in descending order, skip the first one (itself)
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:limit+1]
        # Get the movie indices
        movie_indices = [i[0] for i in sim_scores]
        # Return the movie titles
        return df['title'].iloc[movie_indices].tolist()
    except KeyError as e:
        logger.warning(f"Movie '{title}' not found in the database")
        return []
    except IndexError as e:
        logger.warning(f"Index error while processing '{title}': {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error finding similar movies: {str(e)}")
        return []

def find_best_match(query: str, titles: List[str]) -> Optional[Tuple[str, int]]:
    """Find the best matching movie title using fuzzy matching."""
    try:
        from fuzzywuzzy import process
        result = process.extractOne(query, titles)
        return result if result and result[1] >= SIMILARITY_THRESHOLD else None
    except ImportError:
        logger.warning("fuzzywuzzy not available, using exact matching")
        return next((t, 100) for t in titles if query.lower() == t.lower())
    except Exception as e:
        logger.error(f"Error in fuzzy matching: {str(e)}")
        return None

def get_movie_recommendations(movie_title: str, limit: int = DEFAULT_LIMIT) -> List[Dict[str, Any]]:
    """
    Get movie recommendations based on a movie title.
    
    Args:
        movie_title: Title of the movie to get recommendations for
        limit: Maximum number of recommendations to return (default: 10, max: 20)
        
    Returns:
        List of dictionaries containing recommended movie details:
        [
            {
                'title': str,
                'year': int,
                'genre': str,
                'rating': float,
                'description': str,
                'similarity_score': float
            },
            ...
        ]
    """
    # Validate limit
    limit = max(1, min(limit, MAX_RECOMMENDATIONS))
    
    try:
        # Load data and models if not already loaded
        if 'df' not in globals() or 'cosine_sim' not in globals() or 'indices' not in globals():
            load_models()
        
        # Find the closest matching title
        best_match, _ = find_best_match(movie_title, df['title'].tolist())
        if not best_match:
            logger.warning(f"No close match found for movie: {movie_title}")
            return []
        
        # Get similar movies based on content
        similar_movies = get_similar_movies(best_match, df, cosine_sim, indices, limit)
        
        # Get additional details for each recommended movie
        recommendations = []
        for title in similar_movies:
            try:
                movie_data = df[df['title'] == title].iloc[0]
                recommendations.append({
                    'title': title,
                    'year': int(movie_data.get('release_year', 0)) if pd.notna(movie_data.get('release_year')) else 0,
                    'genre': movie_data.get('genre', ''),
                    'rating': float(movie_data.get('rating', 0)) if pd.notna(movie_data.get('rating')) else 0.0,
                    'description': movie_data.get('description', 'No description available'),
                    'similarity_score': float(cosine_sim[indices[title]][indices[best_match]])
                })
            except Exception as e:
                logger.warning(f"Error processing movie '{title}': {str(e)}")
                continue
        
        # Sort by similarity score in descending order
        recommendations.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error in get_movie_recommendations: {str(e)}")
        return []

def load_models():
    """Load or build the recommendation models."""
    global df, cosine_sim, indices
    try:
        data = load_data()
        if data.empty:
            raise DataLoadError("No movie data available")
        df, cosine_sim, indices = build_recommendation_model(data)
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        raise

# Example usage
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Movie Recommendation System")
    parser.add_argument("--movie", type=str, help="Movie title to get recommendations for")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, 
                       help=f"Number of recommendations (1-{MAX_RECOMMENDATIONS})")
    args = parser.parse_args()
    
    try:
        if args.movie:
            recs = get_movie_recommendations(args.movie, args.limit)
            print(f"\nRecommendations for '{args.movie}':")
            for i, rec in enumerate(recs, 1):
                print(f"{i}. {rec}")
        else:
            # Interactive mode
            print("Movie Recommendation System")
            print("--------------------------")
            while True:
                try:
                    movie_input = input("\nEnter a movie name (or 'quit' to exit): ").strip()
                    if movie_input.lower() in ['quit', 'exit', 'q']:
                        break
                        
                    if not movie_input:
                        print("Please enter a movie name.")
                        continue
                        
                    recs = get_movie_recommendations(movie_input, DEFAULT_LIMIT)
                    if recs:
                        print(f"\nRecommendations for '{movie_input}':")
                        for i, rec in enumerate(recs, 1):
                            print(f"{i}. {rec}")
                    else:
                        print("No recommendations found. Showing popular movies:")
                        for i, rec in enumerate(DEFAULT_RECOMMENDATIONS[:5], 1):
                            print(f"{i}. {rec}")
                            
                except KeyboardInterrupt:
                    print("\nExiting...")
                    break
                except Exception as e:
                    print(f"An error occurred: {str(e)}")
                    continue
                    
    except Exception as e:
        logger.critical(f"Fatal error: {str(e)}", exc_info=True)
        print("A critical error occurred. Please check the logs for details.")