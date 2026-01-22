from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MovieBasic(BaseModel):
    id: int
    title: str
    poster_url: str
    backdrop_url: str
    rating: float
    genres: list
    release_year: int
    description: str

    class Config:
        from_attributes = True

class WatchlistBase(BaseModel):
    movie_id: int

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistUpdate(BaseModel):
    watched: Optional[bool] = None
    watch_progress: Optional[int] = None

class Watchlist(WatchlistBase):
    id: int
    user_id: int
    watched: bool = False
    watch_progress: int = 0
    added_at: datetime
    watched_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WatchlistWithMovie(WatchlistBase):
    id: int
    user_id: int
    watched: bool = False
    watch_progress: int = 0
    added_at: datetime
    watched_at: Optional[datetime] = None
    movie: MovieBasic

    class Config:
        from_attributes = True
