"""
Enhanced TMDb Movie Loader for Streamify
Loads 900 movies from TMDb API into PostgreSQL database
"""
import os
import sys
import time
import json
from datetime import datetime
from typing import List, Dict, Optional

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models import Movie, Base
from app.services.tmdb_service import TMDBService
from app.config import settings
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

# Configuration
MOVIES_TO_LOAD = 900
MOVIES_PER_PAGE = 20  # TMDb returns 20 per page
TOTAL_PAGES = MOVIES_TO_LOAD // MOVIES_PER_PAGE  # 45 pages for 900 movies
API_DELAY = 0.25  # Delay between API calls to respect rate limits
BATCH_SIZE = 10  # Commit every N movies

class MovieLoader:
    def __init__(self):
        self.db = SessionLocal()
        self.tmdb = TMDBService()
        self.stats = {
            'total_loaded': 0,
            'skipped': 0,
            'errors': 0,
            'start_time': datetime.now()
        }
        
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()
        
    def clear_existing_movies(self, confirm=False):
        """Clear all existing movies from database"""
        if confirm:
            print("🗑️  Clearing existing movies...")
            try:
                self.db.query(Movie).delete()
                self.db.commit()
                print("✅ Existing movies cleared")
            except Exception as e:
                print(f"❌ Error clearing movies: {e}")
                self.db.rollback()
    
    def create_tables(self):
        """Create database tables if they don't exist"""
        print("📊 Creating database tables...")
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ Database tables ready")
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            return False
        return True
    
    def test_connection(self):
        """Test database connection"""
        print("🔌 Testing database connection...")
        try:
            result = self.db.execute(text("SELECT 1"))
            print("✅ Database connected successfully")
            
            # Check current movie count
            count = self.db.query(Movie).count()
            print(f"📊 Current movies in database: {count}")
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
    
    def test_tmdb_api(self):
        """Test TMDb API connection"""
        print("🎬 Testing TMDb API...")
        if not settings.tmdb_api_key:
            print("❌ ERROR: TMDB_API_KEY not found in .env file")
            print("   Please add: TMDB_API_KEY=your-api-key")
            return False
        
        try:
            response = self.tmdb.get_popular_movies(page=1)
            if response and 'results' in response:
                print(f"✅ TMDb API connected (found {len(response['results'])} movies)")
                return True
            else:
                print("❌ TMDb API returned invalid response")
                return False
        except Exception as e:
            print(f"❌ TMDb API error: {e}")
            return False
    
    def fetch_movie_details(self, movie_id: int) -> Optional[Dict]:
        """Fetch detailed movie information"""
        try:
            details = self.tmdb.get_movie_details(movie_id)
            if details:
                return details
        except Exception as e:
            print(f"⚠️  Error fetching details for movie {movie_id}: {e}")
        return None
    
    def process_movie(self, movie_data: Dict) -> bool:
        """Process and save a single movie"""
        tmdb_id = movie_data.get('id')
        
        # Check if already exists
        existing = self.db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
        if existing:
            self.stats['skipped'] += 1
            return False
        
        # Fetch detailed information
        details = self.fetch_movie_details(tmdb_id)
        if not details:
            self.stats['errors'] += 1
            return False
        
        try:
            # Extract genres
            genres = [g['name'] for g in details.get('genres', [])]
            
            # Extract cast and director
            cast = []
            director = None
            
            if 'credits' in details:
                if 'cast' in details['credits']:
                    cast = [actor['name'] for actor in details['credits']['cast'][:10]]  # Top 10 actors
                if 'crew' in details['credits']:
                    for person in details['credits']['crew']:
                        if person['job'] == 'Director':
                            director = person['name']
                            break
            
            # Extract release year
            release_date = details.get('release_date', '')
            release_year = None
            if release_date:
                try:
                    release_year = int(release_date[:4])
                except:
                    pass
            
            # Create movie object
            movie = Movie(
                tmdb_id=details['id'],
                title=details['title'],
                description=details.get('overview', ''),
                release_year=release_year,
                duration=details.get('runtime'),
                rating=round(details.get('vote_average', 0.0), 1),
                genres=genres,
                poster_url=self.tmdb.get_poster_url(details.get('poster_path')),
                backdrop_url=self.tmdb.get_backdrop_url(details.get('backdrop_path')),
                trailer_url=None,  # Can be fetched separately if needed
                director=director,
                cast=cast,
                language=details.get('original_language', 'en'),
                country=details.get('production_countries', [{}])[0].get('name') if details.get('production_countries') else None,
                imdb_rating=details.get('vote_average', 0.0),
                popularity_score=details.get('popularity', 0.0),
                tags=[],  # Can be enhanced with keywords API
                is_featured=(details.get('vote_average', 0) >= 7.5 and details.get('vote_count', 0) > 1000),
                content_type='movie'
            )
            
            self.db.add(movie)
            self.stats['total_loaded'] += 1
            return True
            
        except Exception as e:
            print(f"⚠️  Error processing movie '{details.get('title', 'Unknown')}': {e}")
            self.stats['errors'] += 1
            return False
    
    def load_movies(self, pages: int = TOTAL_PAGES):
        """Load movies from TMDb API"""
        print(f"\n🎬 Loading {pages * MOVIES_PER_PAGE} movies from TMDb...")
        print(f"   This will take approximately {int((pages * 20 * API_DELAY) / 60)} minutes")
        print("="*60)
        
        movies_in_batch = 0
        
        for page in range(1, pages + 1):
            print(f"\n📄 Page {page}/{pages}:")
            
            try:
                # Fetch popular movies
                response = self.tmdb.get_popular_movies(page=page)
                if not response or 'results' not in response:
                    print(f"   ❌ Failed to fetch page {page}")
                    continue
                
                movies = response['results']
                page_loaded = 0
                
                # Progress bar for current page
                for i, movie_data in enumerate(movies):
                    # Progress indicator
                    progress = f"   [{i+1}/{len(movies)}] {movie_data.get('title', 'Unknown')[:40]:40}"
                    print(f"{progress}", end='')
                    
                    if self.process_movie(movie_data):
                        print(" ✅")
                        page_loaded += 1
                        movies_in_batch += 1
                        
                        # Commit in batches
                        if movies_in_batch >= BATCH_SIZE:
                            self.db.commit()
                            movies_in_batch = 0
                    else:
                        if self.db.query(Movie).filter(Movie.tmdb_id == movie_data.get('id')).first():
                            print(" ⏭️  (exists)")
                        else:
                            print(" ❌")
                    
                    # Respect API rate limit
                    time.sleep(API_DELAY)
                
                # Commit remaining movies
                if movies_in_batch > 0:
                    self.db.commit()
                    movies_in_batch = 0
                
                print(f"   📊 Page summary: {page_loaded} loaded, {len(movies) - page_loaded} skipped/failed")
                
                # Longer delay between pages
                if page < pages:
                    time.sleep(1)
                    
            except Exception as e:
                print(f"   ❌ Error on page {page}: {e}")
                self.db.rollback()
                continue
        
        # Final commit
        self.db.commit()
    
    def show_statistics(self):
        """Display loading statistics"""
        duration = (datetime.now() - self.stats['start_time']).total_seconds()
        
        print("\n" + "="*60)
        print("📊 LOADING STATISTICS")
        print("="*60)
        print(f"✅ Successfully loaded: {self.stats['total_loaded']} movies")
        print(f"⏭️  Skipped (existing): {self.stats['skipped']} movies")
        print(f"❌ Failed: {self.stats['errors']} movies")
        print(f"⏱️  Time taken: {int(duration/60)} minutes {int(duration%60)} seconds")
        
        # Check final database count
        total_in_db = self.db.query(Movie).count()
        print(f"📊 Total movies in database: {total_in_db}")
        
        # Show sample movies
        print("\n📽️  Sample movies loaded:")
        sample_movies = self.db.query(Movie).limit(5).all()
        for movie in sample_movies:
            print(f"   • {movie.title} ({movie.release_year}) - Rating: {movie.rating}/10")


def main():
    """Main execution function"""
    print("\n" + "="*60)
    print("🎬 STREAMIFY - TMDb MOVIE LOADER")
    print("="*60)
    
    # Ask user for options
    clear_existing = input("\n❓ Clear existing movies before loading? (y/n): ").lower() == 'y'
    
    # Load movies
    with MovieLoader() as loader:
        # Test connections
        if not loader.test_connection():
            print("❌ Cannot proceed without database connection")
            return
        
        if not loader.test_tmdb_api():
            print("❌ Cannot proceed without TMDb API")
            return
        
        # Create tables
        if not loader.create_tables():
            print("❌ Cannot proceed without database tables")
            return
        
        # Clear existing if requested
        if clear_existing:
            loader.clear_existing_movies(confirm=True)
        
        # Load movies
        loader.load_movies(TOTAL_PAGES)
        
        # Show statistics
        loader.show_statistics()
    
    print("\n✅ Movie loading complete!")


if __name__ == "__main__":
    main()
