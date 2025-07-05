# This file makes the utils directory a Python package

# Import the movie_importer function to make it easily accessible
from .movie_importer import import_movies_from_csv

# This allows importing like: from utils import import_movies_from_csv
__all__ = ['import_movies_from_csv']
