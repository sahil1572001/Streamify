import os
import csv
import ast
from datetime import datetime
from sqlalchemy import func
from models import Movie, db, Actor, MovieActor

def import_movies_from_csv():
    """Import movies from CSV files if database is empty."""
    try:
        # Check if movies already exist in the database
        if Movie.query.first() is not None:
            print("Movies already exist in the database. Skipping import.")
            return

        movies_csv = 'tmdb_5000_movies.csv'
        credits_csv = 'tmdb_5000_credits.csv'

        # Check if CSV files exist
        if not (os.path.exists(movies_csv) and os.path.exists(credits_csv)):
            print("CSV files not found. Skipping movie import.")
            return

        print("Starting movie import from CSV files...")
        
        # First, read all credits to create a mapping of movie_id to actors
        movie_credits = {}
        with open(credits_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    movie_id = int(row['movie_id'])
                    cast = ast.literal_eval(row['cast'])
                    movie_credits[movie_id] = [{
                        'name': actor['name'],
                        'character': actor['character'],
                        'order': actor['order']
                    } for actor in cast[:5]]  # Limit to top 5 actors per movie
                except (ValueError, KeyError, SyntaxError) as e:
                    print(f"Error processing credits for movie: {e}")
                    continue

        # Then import movies
        with open(movies_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    # Parse genres (they're stored as JSON strings)
                    genres = ast.literal_eval(row.get('genres', '[]'))
                    genre = genres[0]['name'] if genres else 'Unknown'
                    
                    # Get release year from release_date
                    release_year = None
                    if row.get('release_date'):
                        try:
                            release_year = int(row['release_date'].split('-')[0])
                        except (ValueError, IndexError):
                            pass
                    
                    # Handle poster and banner URLs
                    poster_url = None
                    if row.get('poster_path'):
                        poster_url = f"https://image.tmdb.org/t/p/w500{row['poster_path']}"
                    
                    banner_url = None
                    if row.get('backdrop_path'):
                        banner_url = f"https://image.tmdb.org/t/p/original{row['backdrop_path']}"
                    
                    # Create movie
                    movie = Movie(
                        title=row.get('title', 'Untitled Movie').strip(),
                        description=row.get('overview', 'No description available.').strip(),
                        release_year=release_year,
                        genre=genre,
                        rating=float(row.get('vote_average', 0)) if row.get('vote_average') else 0.0,
                        poster_url=poster_url,
                        banner_url=banner_url,
                        duration=row.get('runtime', 0) or 0,
                        language=row.get('original_language', 'en'),
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    
                    db.session.add(movie)
                    db.session.flush()  # Get the movie ID for actor association
                    
                    # Add actors if available
                    movie_id = int(row.get('id', 0))
                    if movie_id in movie_credits:
                        for actor_data in movie_credits[movie_id]:
                            # Find or create actor
                            actor = Actor.query.filter(
                                func.lower(Actor.name) == func.lower(actor_data['name'])
                            ).first()
                            
                            if not actor:
                                actor = Actor(
                                    name=actor_data['name'],
                                    created_at=datetime.utcnow(),
                                    updated_at=datetime.utcnow()
                                )
                                db.session.add(actor)
                                db.session.flush()
                            
                            # Create movie-actor association
                            movie_actor = MovieActor(
                                movie_id=movie.id,
                                actor_id=actor.id,
                                character_name=actor_data['character'],
                                cast_order=actor_data['order'],
                                created_at=datetime.utcnow(),
                                updated_at=datetime.utcnow()
                            )
                            db.session.add(movie_actor)
                    
                    # Commit every 50 records to avoid memory issues
                    if Movie.query.count() % 50 == 0:
                        db.session.commit()
                        
                except Exception as e:
                    print(f"Error processing movie {row.get('title')}: {str(e)}")
                    db.session.rollback()
        
        db.session.commit()
        print(f"Successfully imported {Movie.query.count()} movies from CSV files.")
        
    except Exception as e:
        print(f"Error during movie import: {str(e)}")
        db.session.rollback()
        raise
