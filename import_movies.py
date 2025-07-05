import csv
import ast
from datetime import datetime
from app import create_app
from extensions import db
from models import Movie

def import_movies():
    app = create_app()
    with app.app_context():
        print("Starting movie import...")
        
        # Read movies from CSV
        with open('tmdb_5000_movies.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, 1):
                try:
                    # Parse genres (they're stored as JSON strings)
                    genres = ast.literal_eval(row['genres'])
                    genre = genres[0]['name'] if genres else 'Unknown'
                    
                    # Get release year from release_date
                    release_year = None
                    if row['release_date']:
                        try:
                            release_year = int(row['release_date'].split('-')[0])
                        except (ValueError, IndexError):
                            pass
                    
                    # Create movie with default poster if not available
                    poster_url = None
                    if row.get('poster_path'):
                        poster_url = f"https://image.tmdb.org/t/p/w500{row['poster_path']}"
                    
                    banner_url = None
                    if row.get('backdrop_path'):
                        banner_url = f"https://image.tmdb.org/t/p/original{row['backdrop_path']}"
                    
                    # Create movie
                    movie = Movie(
                        title=row.get('title', 'Untitled Movie'),
                        description=row.get('overview', 'No description available.'),
                        release_year=release_year,
                        genre=genre,
                        rating=float(row.get('vote_average', 0)) if row.get('vote_average') else 0.0,
                        poster_url=poster_url,
                        banner_url=banner_url
                    )
                    db.session.add(movie)
                    
                    # Commit every 100 records to avoid memory issues
                    if i % 100 == 0:
                        db.session.commit()
                        print(f"Imported {i} movies...")
                        
                except Exception as e:
                    print(f"Error importing {row.get('title', 'unknown')}: {str(e)}")
                    continue
            
            # Final commit
            db.session.commit()
            print(f"Successfully imported {i} movies!")

if __name__ == '__main__':
    import_movies()
