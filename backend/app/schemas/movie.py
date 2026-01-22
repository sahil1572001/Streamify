from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MovieBase(BaseModel):
    title: str
    description: Optional[str] = None
    release_year: Optional[int] = None
    duration: Optional[int] = None
    rating: Optional[float] = 0.0
    genres: Optional[List[str]] = []
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    trailer_url: Optional[str] = None
    director: Optional[str] = None
    cast: Optional[List[str]] = []
    language: Optional[str] = None
    country: Optional[str] = None
    imdb_rating: Optional[float] = None
    popularity_score: Optional[float] = 0.0
    tags: Optional[List[str]] = []

class MovieCreate(MovieBase):
    pass

class MovieUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    release_year: Optional[int] = None
    duration: Optional[int] = None
    rating: Optional[float] = None
    genres: Optional[List[str]] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    trailer_url: Optional[str] = None
    director: Optional[str] = None
    cast: Optional[List[str]] = None
    language: Optional[str] = None
    country: Optional[str] = None
    imdb_rating: Optional[float] = None
    popularity_score: Optional[float] = None
    tags: Optional[List[str]] = None

class Movie(MovieBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MovieList(BaseModel):
    movies: List[Movie]
    total: int
    page: int
    page_size: int
