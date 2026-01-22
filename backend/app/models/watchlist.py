from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    watched = Column(Boolean, default=False)
    watch_progress = Column(Integer, default=0)  # in seconds
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    watched_at = Column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="watchlist")
    movie = relationship("Movie")
