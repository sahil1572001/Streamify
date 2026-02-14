from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy.sql.expression import text
from sqlalchemy.orm import relationship
from ..database import Base

class VisionBoard(Base):
    __tablename__ = "vision_board"
    
    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False, default=0)  # Order in the vision board
    priority = Column(String, nullable=False, default='medium')  # high, medium, low
    notes = Column(Text, nullable=True)  # Personal notes about why they want to watch
    added_at = Column(TIMESTAMP(timezone=True), 
                     nullable=False, 
                     server_default=text('now()'))
    
    # Relationships
    user = relationship("User")
    movie = relationship("Movie")
