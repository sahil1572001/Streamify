from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, ARRAY, String
from typing import List, Optional
from ..database import get_db
from ..models.movie import Movie
from ..schemas.movie import Movie as MovieSchema, MovieCreate, MovieUpdate, MovieList
from ..auth import get_current_user

router = APIRouter(
    prefix="/api/movies",
    tags=["movies"]
)

@router.get("/", response_model=MovieList)
async def get_movies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    genre: Optional[str] = None,
    year: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all movies with pagination and filters"""
    query = db.query(Movie)
    
    # Apply filters
    if genre:
        # Cast JSON to text and search
        query = query.filter(cast(Movie.genres, String).ilike(f"%{genre}%"))
    if year:
        query = query.filter(Movie.release_year == year)
    if search:
        query = query.filter(Movie.title.ilike(f"%{search}%"))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    movies = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "movies": movies,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/featured", response_model=List[MovieSchema])
async def get_featured_movies(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get featured/popular movies"""
    movies = db.query(Movie).order_by(Movie.popularity_score.desc()).limit(limit).all()
    return movies

@router.get("/trending", response_model=List[MovieSchema])
async def get_trending_movies(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get trending movies"""
    movies = db.query(Movie).order_by(Movie.created_at.desc()).limit(limit).all()
    return movies

@router.get("/top-rated", response_model=List[MovieSchema])
async def get_top_rated_movies(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get top rated movies"""
    movies = db.query(Movie).order_by(Movie.rating.desc()).limit(limit).all()
    return movies

@router.get("/by-genre", response_model=List[MovieSchema])
async def get_movies_by_genre(
    genre: str = Query(..., description="Genre to filter by"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get movies by specific genre"""
    # Search for genre in the genres array
    movies = db.query(Movie).filter(
        cast(Movie.genres, String).ilike(f"%{genre}%")
    ).order_by(Movie.rating.desc()).limit(limit).all()
    return movies

@router.get("/{movie_id}", response_model=MovieSchema)
async def get_movie(movie_id: int, db: Session = Depends(get_db)):
    """Get a specific movie by ID"""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

@router.post("/", response_model=MovieSchema)
async def create_movie(
    movie: MovieCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new movie (admin only)"""
    db_movie = Movie(**movie.dict())
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie

@router.put("/{movie_id}", response_model=MovieSchema)
async def update_movie(
    movie_id: int,
    movie: MovieUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a movie (admin only)"""
    db_movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not db_movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    update_data = movie.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_movie, field, value)
    
    db.commit()
    db.refresh(db_movie)
    return db_movie

@router.delete("/{movie_id}")
async def delete_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a movie (admin only)"""
    db_movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not db_movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    db.delete(db_movie)
    db.commit()
    return {"message": "Movie deleted successfully"}
