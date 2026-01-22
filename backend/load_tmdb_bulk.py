"""
Bulk load movies, TV shows, and anime from TMDB API
Downloads 900+ titles and stores them permanently in AWS RDS
"""
import requests
import time
from datetime import datetime
from app.database import SessionLocal
from app.models import Movie
from app.config import settings

class TMDBBulkLoader:
    def __init__(self):
        self.api_key = settings.tmdb_api_key
        self.base_url = "https://api.themoviedb.org/3"
        self.image_base_url = "https://image.tmdb.org/t/p/w500"
        
        if not self.api_key:
            raise ValueError("TMDB_API_KEY not set in .env file")
        
        self.db = SessionLocal()
        self.loaded_count = 0
        self.failed_count = 0
        self.duplicate_count = 0
        self.start_time = time.time()
    
    def get_movies(self, page=1, retries=3):
        """Fetch popular movies from TMDB"""
        url = f"{self.base_url}/movie/popular"
        params = {
            'api_key': self.api_key,
            'page': page,
            'language': 'en-US',
            'sort_by': 'popularity.desc'
        }
        for attempt in range(retries):
            try:
                response = requests.get(url, params=params, timeout=15)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                if attempt < retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"  ⚠️  Retry {attempt + 1}/{retries} for page {page} (waiting {wait_time}s)...")
                    time.sleep(wait_time)
                else:
                    print(f"❌ Error fetching movies page {page}: {str(e)[:60]}")
                    return None
    
    def get_tv_shows(self, page=1, retries=3):
        """Fetch popular TV shows from TMDB"""
        url = f"{self.base_url}/tv/popular"
        params = {
            'api_key': self.api_key,
            'page': page,
            'language': 'en-US',
            'sort_by': 'popularity.desc'
        }
        for attempt in range(retries):
            try:
                response = requests.get(url, params=params, timeout=15)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                if attempt < retries - 1:
                    wait_time = 2 ** attempt
                    print(f"  ⚠️  Retry {attempt + 1}/{retries} for page {page} (waiting {wait_time}s)...")
                    time.sleep(wait_time)
                else:
                    print(f"❌ Error fetching TV shows page {page}: {str(e)[:60]}")
                    return None
    
    def get_anime(self, page=1, retries=3):
        """Fetch anime from TMDB (TV shows with anime genre)"""
        url = f"{self.base_url}/discover/tv"
        params = {
            'api_key': self.api_key,
            'page': page,
            'language': 'en-US',
            'with_genres': '16',  # Animation genre
            'sort_by': 'popularity.desc'
        }
        for attempt in range(retries):
            try:
                response = requests.get(url, params=params, timeout=15)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                if attempt < retries - 1:
                    wait_time = 2 ** attempt
                    print(f"  ⚠️  Retry {attempt + 1}/{retries} for page {page} (waiting {wait_time}s)...")
                    time.sleep(wait_time)
                else:
                    print(f"❌ Error fetching anime page {page}: {str(e)[:60]}")
                    return None
    
    def movie_exists(self, tmdb_id):
        """Check if movie already exists in database"""
        return self.db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first() is not None
    
    def save_movie(self, data, content_type='movie'):
        """Save a movie/show to the database"""
        try:
            tmdb_id = data.get('id')
            
            # Check if already exists
            if self.movie_exists(tmdb_id):
                self.duplicate_count += 1
                return False
            
            # Extract data
            title = data.get('title') or data.get('name', 'Unknown')
            description = data.get('overview', '')
            poster_path = data.get('poster_path')
            backdrop_path = data.get('backdrop_path')
            rating = data.get('vote_average', 0)
            release_date = data.get('release_date') or data.get('first_air_date', '')
            
            # Extract year from release date
            release_year = int(release_date[:4]) if release_date else datetime.now().year
            
            # Get genres
            genres = []
            if 'genres' in data:
                genres = [g['name'] for g in data.get('genres', [])]
            
            # Create poster and backdrop URLs
            poster_url = f"{self.image_base_url}{poster_path}" if poster_path else None
            backdrop_url = f"{self.image_base_url}{backdrop_path}" if backdrop_path else None
            
            # Create movie object
            movie = Movie(
                tmdb_id=tmdb_id,
                title=title,
                description=description,
                poster_url=poster_url,
                backdrop_url=backdrop_url,
                rating=rating,
                release_year=release_year,
                genres=genres,
                content_type=content_type,
                popularity_score=data.get('popularity', 0)
            )
            
            self.db.add(movie)
            self.db.commit()
            self.loaded_count += 1
            return True
            
        except Exception as e:
            self.db.rollback()
            self.failed_count += 1
            print(f"  ⚠️  Error saving {data.get('title', 'Unknown')}: {str(e)[:60]}")
            return False
    
    def load_content(self, content_type='movie', max_pages=10):
        """Load content from TMDB"""
        print(f"\n📥 Loading {content_type}s (up to {max_pages} pages)...")
        
        for page in range(1, max_pages + 1):
            # Get data based on content type
            if content_type == 'movie':
                data = self.get_movies(page)
            elif content_type == 'tv':
                data = self.get_tv_shows(page)
            elif content_type == 'anime':
                data = self.get_anime(page)
            else:
                continue
            
            if not data or 'results' not in data:
                print(f"  ⚠️  No more results at page {page}")
                break
            
            results = data.get('results', [])
            print(f"  Page {page}: Processing {len(results)} items...")
            
            for item in results:
                self.save_movie(item, content_type)
            
            # Show progress
            if page % 5 == 0:
                elapsed = time.time() - self.start_time
                rate = self.loaded_count / elapsed
                print(f"    ✅ Loaded: {self.loaded_count} | Failed: {self.failed_count} | Duplicates: {self.duplicate_count}")
                print(f"    ⏱️  Rate: {rate:.1f} items/sec")
            
            # Rate limiting (TMDB allows 40 requests per 10 seconds)
            time.sleep(0.3)
    
    def run(self):
        """Run the bulk loader"""
        print("\n" + "="*70)
        print("📥 TMDB BULK LOADER - Movies, TV Shows & Anime")
        print("="*70)
        print(f"Target: 900+ titles")
        print(f"Database: AWS RDS ({settings.aws_rds_endpoint})")
        print("="*70)
        
        try:
            # Load movies (300 items = 10 pages × 20 per page)
            self.load_content('movie', max_pages=15)
            
            # Load TV shows (300 items)
            self.load_content('tv', max_pages=15)
            
            # Load anime (300 items)
            self.load_content('anime', max_pages=15)
            
            # Final summary
            elapsed = time.time() - self.start_time
            total = self.loaded_count + self.failed_count + self.duplicate_count
            
            print("\n" + "="*70)
            print("✅ BULK LOAD COMPLETE")
            print("="*70)
            print(f"📊 Summary:")
            print(f"   Successfully loaded: {self.loaded_count}")
            print(f"   Failed: {self.failed_count}")
            print(f"   Duplicates skipped: {self.duplicate_count}")
            print(f"   Total processed: {total}")
            print(f"   Time elapsed: {elapsed:.1f}s")
            print(f"   Average rate: {self.loaded_count/elapsed:.1f} items/sec")
            print("="*70 + "\n")
            
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            self.db.close()

if __name__ == "__main__":
    loader = TMDBBulkLoader()
    loader.run()
