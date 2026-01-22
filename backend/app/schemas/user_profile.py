"""
User Profile Schemas
Pydantic models for user profile operations
"""
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserPreferences(BaseModel):
    """User preferences for personalization"""
    favorite_genres: List[str] = []
    favorite_themes: List[str] = []
    preferred_languages: List[str] = ["en"]
    min_rating: Optional[float] = None
    exclude_genres: List[str] = []

class UserProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = None
    bio: Optional[str] = None
    favorite_genres: Optional[List[str]] = None
    favorite_themes: Optional[List[str]] = None
    preferences: Optional[UserPreferences] = None

class UserProfileResponse(BaseModel):
    """Schema for user profile response"""
    id: int
    email: EmailStr
    full_name: Optional[str]
    bio: Optional[str]
    favorite_genres: List[str]
    favorite_themes: List[str]
    watch_history: List[dict]
    preferences: Optional[dict]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class WatchHistoryItem(BaseModel):
    """Single watch history entry"""
    movie_id: int
    watched_at: datetime
    rating: Optional[float] = None
    completed: bool = True

class AddToWatchHistory(BaseModel):
    """Schema for adding to watch history"""
    movie_id: int
    rating: Optional[float] = None
    completed: bool = True
