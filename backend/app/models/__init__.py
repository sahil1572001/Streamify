# This file makes the models directory a Python package

from sqlalchemy.ext.declarative import declarative_base
from ..database import Base
from .user import User
from .movie import Movie
from .watchlist import Watchlist

# Create a base class for all models
# Base = declarative_base()  # This line is commented out as it's not needed due to the import from ..database

# Make models available at the package level
__all__ = [
    'Base',
    'User',
    'Movie',
    'Watchlist'
]
