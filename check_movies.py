from app import create_app
from extensions import db
from models import Movie

app = create_app()

with app.app_context():
    # Get total number of movies
    total_movies = db.session.query(Movie).count()
    print(f"Total movies in database: {total_movies}")
    
    # Get sample of movies with their genres
    movies = Movie.query.limit(5).all()
    print("\nSample of movies:")
    for movie in movies:
        print(f"- {movie.title} (ID: {movie.id}, Genre: {movie.genre})")
    
    # Count movies by genre
    if total_movies > 0:
        print("\nMovies by genre:")
        genres = db.session.query(Movie.genre, db.func.count(Movie.id))\
                        .group_by(Movie.genre)\
                        .all()
        for genre, count in genres:
            print(f"- {genre or 'No genre'}: {count} movies")
