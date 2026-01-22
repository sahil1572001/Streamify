"""
Semantic Search Router
Handles vector-based movie search and recommendations
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from ..models.movie import Movie
from ..models.user import User
from ..services.pinecone_service import PineconeService
from ..services.embedding_service import EmbeddingService
from ..schemas.movie import Movie as MovieSchema
from ..auth import get_current_user

router = APIRouter(
    prefix="/api/search",
    tags=["search"]
)

# Request/Response Models
class SemanticSearchRequest(BaseModel):
    query: str
    top_k: int = 10
    filters: Optional[dict] = None
    use_profile: bool = True

class SemanticSearchResponse(BaseModel):
    movies: List[MovieSchema]
    query: str
    total_results: int
    search_time_ms: float

class RecommendationRequest(BaseModel):
    top_k: int = 10
    filters: Optional[dict] = None

# Initialize services (will be lazy-loaded)
pinecone_service = None
embedding_service = None

def get_pinecone_service():
    """Get or create Pinecone service instance"""
    global pinecone_service
    if pinecone_service is None:
        try:
            pinecone_service = PineconeService()
        except ValueError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Pinecone service not configured: {str(e)}"
            )
    return pinecone_service

def get_embedding_service():
    """Get or create Embedding service instance"""
    global embedding_service
    if embedding_service is None:
        try:
            embedding_service = EmbeddingService()
        except ValueError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Embedding service not configured: {str(e)}"
            )
    return embedding_service

@router.post("/semantic", response_model=SemanticSearchResponse)
async def semantic_search(
    request: SemanticSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Perform semantic search using vector similarity
    
    - **query**: Natural language search query
    - **top_k**: Number of results to return
    - **filters**: Optional metadata filters (genre, year, rating, etc.)
    - **use_profile**: Whether to personalize results using user profile
    """
    import time
    start_time = time.time()
    
    try:
        # Get services
        pinecone = get_pinecone_service()
        embedder = get_embedding_service()
        
        # Generate query embedding
        query_embedding = embedder.generate_query_embedding(request.query)
        
        # Get user profile embedding if personalization is enabled
        user_embedding = None
        if request.use_profile and current_user.profile_vector_id:
            user_profile = pinecone.get_user_profile(current_user.id)
            if user_profile:
                user_embedding = user_profile['values']
        
        # Perform hybrid search
        results = pinecone.search_hybrid(
            query_embedding=query_embedding,
            user_embedding=user_embedding,
            top_k=request.top_k,
            filter_dict=request.filters
        )
        
        # Extract movie IDs from results
        movie_ids = []
        for result in results:
            # Extract movie ID from vector ID (format: "movie_123")
            vector_id = result['id']
            if vector_id.startswith('movie_'):
                movie_id = int(vector_id.split('_')[1])
                movie_ids.append(movie_id)
        
        # Fetch full movie data from PostgreSQL
        movies = db.query(Movie).filter(Movie.id.in_(movie_ids)).all()
        
        # Sort movies by the order of results
        movie_dict = {movie.id: movie for movie in movies}
        sorted_movies = [movie_dict[mid] for mid in movie_ids if mid in movie_dict]
        
        search_time = (time.time() - start_time) * 1000  # Convert to ms
        
        return SemanticSearchResponse(
            movies=sorted_movies,
            query=request.query,
            total_results=len(sorted_movies),
            search_time_ms=round(search_time, 2)
        )
        
    except Exception as e:
        import traceback
        print(f"❌ Semantic search error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

@router.post("/recommendations", response_model=List[MovieSchema])
async def get_recommendations(
    request: RecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get personalized movie recommendations using vector similarity
    Based on user's watchlist and preferences
    
    - **top_k**: Number of recommendations to return
    - **filters**: Optional metadata filters
    """
    try:
        from ..models.watchlist import Watchlist
        
        # Get services
        pinecone = get_pinecone_service()
        embedder = get_embedding_service()
        
        # Get user's watchlist
        watchlist_items = db.query(Watchlist).filter(
            Watchlist.user_id == current_user.id
        ).all()
        
        # If no watchlist, return top-rated movies
        if not watchlist_items:
            print(f"No watchlist for user {current_user.id}, returning top-rated movies")
            movies = db.query(Movie).order_by(Movie.rating.desc()).limit(request.top_k).all()
            return movies
        
        # Check if services are available
        if not pinecone or not embedder:
            print(f"Vector services not available, falling back to genre-based recommendations")
            # Fallback to genre-based
            watchlist_movie_ids = [item.movie_id for item in watchlist_items]
            watchlist_movies = db.query(Movie).filter(Movie.id.in_(watchlist_movie_ids)).all()
            
            user_genres = set()
            for movie in watchlist_movies:
                if movie.genres:
                    user_genres.update(movie.genres)
            
            recommended_movies = db.query(Movie).filter(
                ~Movie.id.in_(watchlist_movie_ids),
                Movie.genres.overlap(list(user_genres))
            ).order_by(Movie.rating.desc()).limit(request.top_k).all()
            
            if len(recommended_movies) < request.top_k:
                additional = db.query(Movie).filter(
                    ~Movie.id.in_(watchlist_movie_ids + [m.id for m in recommended_movies])
                ).order_by(Movie.rating.desc()).limit(request.top_k - len(recommended_movies)).all()
                recommended_movies.extend(additional)
            
            return recommended_movies
        
        # Vector-based recommendations using Pinecone
        print(f"Generating vector-based recommendations for user {current_user.id}")
        
        # Get user's profile vector from Pinecone
        user_vector_id = f"user_{current_user.id}"
        user_profile = pinecone.get_user_profile(current_user.id)
        
        if not user_profile:
            # Generate user profile from watchlist
            print(f"No existing profile vector, generating from watchlist")
            watchlist_movie_ids = [item.movie_id for item in watchlist_items]
            watchlist_movies = db.query(Movie).filter(Movie.id.in_(watchlist_movie_ids)).all()
            
            watched_movies_data = [
                {
                    'title': movie.title,
                    'genres': movie.genres,
                    'description': movie.description,
                    'cast': movie.cast,
                    'director': movie.director
                }
                for movie in watchlist_movies
            ]
            
            preferences = {
                'favorite_genres': current_user.favorite_genres or [],
                'favorite_themes': current_user.favorite_themes or []
            }
            
            user_embedding = embedder.generate_user_profile_embedding(
                watched_movies=watched_movies_data,
                preferences=preferences
            )
            
            # Store in Pinecone
            pinecone.upsert_user_profile(
                user_id=current_user.id,
                profile_embedding=user_embedding,
                metadata={
                    'user_id': current_user.id,
                    'email': current_user.email,
                    'favorite_genres': current_user.favorite_genres or [],
                    'watchlist_count': len(watchlist_movie_ids)
                }
            )
            
            # Update user record
            current_user.profile_vector_id = user_vector_id
            db.commit()
        else:
            user_embedding = user_profile['values']
        
        # Search for similar movies in Pinecone
        print(f"Searching for similar movies...")
        results = pinecone.search_similar_movies(
            query_embedding=user_embedding,
            top_k=request.top_k * 3,  # Get more to filter out watched
            filter_dict=request.filters
        )
        
        # Extract movie IDs and filter out already watched
        watchlist_movie_ids = {item.movie_id for item in watchlist_items}
        movie_ids = []
        
        for result in results:
            vector_id = result['id']
            if vector_id.startswith('movie_'):
                movie_id = int(vector_id.split('_')[1])
                if movie_id not in watchlist_movie_ids:
                    movie_ids.append(movie_id)
                    if len(movie_ids) >= request.top_k:
                        break
        
        # Fetch movies from database
        if movie_ids:
            movies = db.query(Movie).filter(Movie.id.in_(movie_ids)).all()
            
            # Sort by result order
            movie_dict = {movie.id: movie for movie in movies}
            sorted_movies = [movie_dict[mid] for mid in movie_ids if mid in movie_dict]
            
            print(f"✅ Found {len(sorted_movies)} vector-based recommendations")
            return sorted_movies
        else:
            # Fallback to top-rated if no vector results
            print(f"No vector results, returning top-rated movies")
            movies = db.query(Movie).order_by(Movie.rating.desc()).limit(request.top_k).all()
            return movies
        
    except Exception as e:
        print(f"❌ Recommendation error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Recommendation failed: {str(e)}"
        )

@router.get("/similar/{movie_id}", response_model=List[MovieSchema])
async def get_similar_movies(
    movie_id: int,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Find movies similar to a given movie
    
    - **movie_id**: ID of the reference movie
    - **limit**: Number of similar movies to return
    """
    try:
        # Get the reference movie
        movie = db.query(Movie).filter(Movie.id == movie_id).first()
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")
        
        # Get services
        pinecone = get_pinecone_service()
        embedder = get_embedding_service()
        
        # Generate embedding for the movie
        movie_data = {
            'title': movie.title,
            'description': movie.description,
            'genres': movie.genres,
            'director': movie.director,
            'cast': movie.cast,
            'tags': movie.tags
        }
        
        movie_embedding = embedder.generate_movie_embedding(movie_data)
        
        # Search for similar movies
        results = pinecone.search_similar_movies(
            query_embedding=movie_embedding,
            top_k=limit + 1  # +1 to exclude the query movie itself
        )
        
        # Extract movie IDs (excluding the query movie)
        movie_ids = []
        for result in results:
            vector_id = result['id']
            if vector_id.startswith('movie_'):
                mid = int(vector_id.split('_')[1])
                if mid != movie_id:
                    movie_ids.append(mid)
        
        # Fetch movies
        movies = db.query(Movie).filter(Movie.id.in_(movie_ids)).all()
        
        # Sort by result order
        movie_dict = {movie.id: movie for movie in movies}
        sorted_movies = [movie_dict[mid] for mid in movie_ids if mid in movie_dict]
        
        return sorted_movies[:limit]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Similar search failed: {str(e)}"
        )
