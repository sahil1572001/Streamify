from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ARRAY, JSON, Boolean
from sqlalchemy.sql import func
from ..database import Base

class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, index=True)  # TMDB API ID
    title = Column(String, nullable=False, index=True)
    description = Column(Text)
    release_year = Column(Integer, index=True)
    duration = Column(Integer)  # in minutes
    rating = Column(Float, default=0.0)
    genres = Column(JSON)  # Store as JSON array
    poster_url = Column(String)
    backdrop_url = Column(String)
    trailer_url = Column(String)
    director = Column(String)
    cast = Column(JSON)  # Store as JSON array
    language = Column(String)
    country = Column(String)
    imdb_rating = Column(Float)
    popularity_score = Column(Float, default=0.0)
    tags = Column(JSON)  # Themes, moods, etc.
    is_featured = Column(Boolean, default=False, index=True)  # Featured content
    content_type = Column(String, default='movie', index=True)  # 'movie' or 'tv'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
