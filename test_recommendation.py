import os
import sys
import logging
from recommendation import get_movie_recommendations, load_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def test_recommendation():
    print("=== Testing Movie Recommendation System ===")
    
    # Test data loading
    print("\n1. Testing data loading...")
    try:
        df = load_data()
        print(f"✅ Successfully loaded data with {len(df)} movies")
        
        # Print DataFrame info and columns
        print("\nDataFrame Info:")
        print(df.info())
        
        print("\nDataFrame Columns:")
        print(df.columns.tolist())
        
        # Try to print first few rows
        print("\nFirst 3 rows:")
        print(df.head(3))
        
        # Check for title column variations
        title_columns = [col for col in df.columns if 'title' in col.lower()]
        print(f"\nPossible title columns: {title_columns}")
        
        if title_columns:
            print(f"\nSample movie titles from first title column ({title_columns[0]}):")
            print(df[title_columns[0]].head(3).tolist())
    except Exception as e:
        print(f"❌ Error loading data: {str(e)}")
        return
    
    # Test recommendation
    test_movie = "The Dark Knight"
    print(f"\n2. Testing recommendation for '{test_movie}'...")
    try:
        recommendations = get_movie_recommendations(movie_title=test_movie, limit=10)
        if recommendations:
            print("✅ Recommendations found:")
            for i, movie in enumerate(recommendations, 1):
                if isinstance(movie, dict):
                    print(f"   {i}. {movie.get('title', 'N/A')} (Similarity: {movie.get('similarity_score', 0):.2f})")
                    print(f"      Genre: {movie.get('genre', 'N/A')}, Rating: {movie.get('rating', 'N/A')}")
                else:
                    print(f"   {i}. {movie}")
        else:
            print("❌ No recommendations found")
    except Exception as e:
        print(f"❌ Error getting recommendations: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print(f"Current working directory: {os.getcwd()}")
    print(f"Files in directory: {os.listdir('.')}")
    test_recommendation()
