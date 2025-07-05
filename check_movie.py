from app import create_app
from models import Movie

app = create_app()

with app.app_context():
    # Check if movie with ID 4131 exists
    movie = Movie.query.get(4131)
    if movie:
        print(f"Found movie: {movie.title} (ID: {movie.id}, Genre: {movie.genre})")
        print(f"Overview: {movie.overview}")
    else:
        print("Movie with ID 4131 not found in the database")
    
    # Check if movie with ID 1 exists
    movie = Movie.query.get(1)
    if movie:
        print(f"\nFound movie: {movie.title} (ID: {movie.id}, Genre: {movie.genre})")
        print(f"Overview: {movie.overview}")
    else:
        print("\nMovie with ID 1 not found in the database")
