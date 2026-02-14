from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .movie import Movie

class VisionBoardBase(BaseModel):
    movie_id: int
    position: Optional[int] = 0
    priority: Optional[str] = 'medium'
    notes: Optional[str] = None

class VisionBoardCreate(VisionBoardBase):
    pass

class VisionBoardUpdate(BaseModel):
    position: Optional[int] = None
    priority: Optional[str] = None
    notes: Optional[str] = None

class VisionBoard(VisionBoardBase):
    id: int
    user_id: int
    added_at: datetime

    class Config:
        from_attributes = True

class VisionBoardWithMovie(VisionBoard):
    movie: Optional[Movie] = None

    class Config:
        from_attributes = True
