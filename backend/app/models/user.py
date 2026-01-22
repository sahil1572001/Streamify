from sqlalchemy import Column, Integer, String, Boolean, JSON, Text
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy.sql.expression import text
from sqlalchemy.orm import relationship
from . import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, server_default='TRUE', nullable=False)
    preferences = Column(JSON, nullable=True)  # User preferences for genres, themes, etc.
    profile_vector_id = Column(String, nullable=True)  # Pinecone vector ID
    watch_history = Column(JSON, nullable=True)  # List of watched movie IDs with timestamps
    favorite_genres = Column(JSON, nullable=True)  # List of favorite genres
    favorite_themes = Column(JSON, nullable=True)  # List of favorite themes
    bio = Column(Text, nullable=True)  # User bio/description
    created_at = Column(TIMESTAMP(timezone=True), 
                       nullable=False, 
                       server_default=text('now()'))
    updated_at = Column(TIMESTAMP(timezone=True), 
                       nullable=False, 
                       server_default=text('now()'),
                       onupdate=text('now()'))
    
    # Relationships
    watchlist = relationship("Watchlist", back_populates="user")
