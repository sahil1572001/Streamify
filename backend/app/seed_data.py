"""
Seed data module for Streamify
Loads initial movie data into the database
"""
import sys
import time
from app.database import SessionLocal
from app.models import Movie
from app.services.tmdb_service import TMDBService
from app.config import settings


def safe_api_call(func, *args, **kwargs):
    """Safely call TMDB API with error handling"""
    try:
        return func(*args, **kwargs)
    except Exception as e:
        print(f"API Error: {str(e)}")
        return None


def seed_movies(num_pages=2):
    """Load movies from TMDB API into database"""
    print("\n" + "="*60)
    print("STREAMIFY - SEED DATA LOADER")
    print("="*60 + "\n")
    
    if not settings.tmdb_api_key:
        print("❌ ERROR: TMDB_API_KEY not found in .env file")
        return False
    
    db = SessionLocal()
    tmdb = TMDBService()
    
    try:
        print(f"📽️  Loading Popular Movies ({num_pages} pages)...")
        
        total_loaded = 0
        
        for page in range(1, num_pages + 1):
            print(f"  Page {page}/{num_pages}...", end=" ", flush=True)
            
            response = safe_api_call(tmdb.get_popular_movies, page=page)
            if not response:
                print("❌ Failed")
                continue
            
            movies = response.get('results', [])
            page_loaded = 0
            
            for movie_data in movies:
                # Check if exists
                existing = db.query(Movie).filter(
                    Movie.tmdb_id == movie_data['id']
                ).first()
                
                if existing:
                    continue
                
                try:
                    # Get details
                    details = safe_api_call(tmdb.get_movie_details, movie_data['id'])
                    if not details:
                        continue
                    
                    # Extract data
                    genres = [g['name'] for g in details.get('genres', [])]
                    cast = []
                    director = None
                    
                    if 'credits' in details:
                        if 'cast' in details['credits']:
                            cast = [actor['name'] for actor in details['credits']['cast'][:5]]
                        if 'crew' in details['credits']:
                            for person in details['credits']['crew']:
                                if person['job'] == 'Director':
                                    director = person['name']
                                    break
                    
                    # Create movie
                    movie = Movie(
                        tmdb_id=details['id'],
                        title=details['title'],
                        description=details.get('overview', ''),
                        release_year=int(details.get('release_date', '2000-01-01')[:4]) if details.get('release_date') else None,
                        rating=round(details.get('vote_average', 0.0), 1),
                        genres=genres,
                        poster_url=tmdb.get_poster_url(details.get('poster_path', '')),
                        backdrop_url=tmdb.get_backdrop_url(details.get('backdrop_path', '')),
                        duration=details.get('runtime'),
                        cast=cast,
                        director=director,
                        language=details.get('original_language', 'en'),
                        is_featured=(details.get('vote_average', 0) >= 7.5),
                        content_type='movie'
                    )
                    
                    db.add(movie)
                    page_loaded += 1
                    time.sleep(0.3)
                    
                except Exception as e:
                    print(f"\n  ⚠️  Error: {str(e)[:50]}")
                    continue
            
            db.commit()
            total_loaded += page_loaded
            print(f"✓ Loaded: {page_loaded}")
            time.sleep(1)
        
        print(f"\n✅ Complete! Loaded {total_loaded} movies")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    seed_movies()
