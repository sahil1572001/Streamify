"""
Simple TMDb Movie Loader with Retry Logic
Loads movies from TMDb API into PostgreSQL database
"""
import os
import sys
import time
import requests
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models import Movie, Base
from app.config import settings

class SimpleTMDbLoader:
    def __init__(self):
        self.api_key = settings.tmdb_api_key
        self.base_url = "https://api.themoviedb.org/3"
        self.db = SessionLocal()
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': 'Streamify/1.0'
        })
        
    def test_api(self):
        """Test TMDb API connection with retry"""
        print("🎬 Testing TMDb API connection...")
        
        for attempt in range(3):
            try:
                url = f"{self.base_url}/movie/popular"
                params = {
                    'api_key': self.api_key,
                    'page': 1
                }
                
                response = self.session.get(url, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ API connected! Found {len(data.get('results', []))} movies")
                    return True
                else:
                    print(f"❌ API returned status code: {response.status_code}")
                    
            except requests.exceptions.ConnectionError as e:
                print(f"⚠️  Connection error (attempt {attempt + 1}/3): {str(e)[:50]}")
                time.sleep(2)
            except Exception as e:
                print(f"❌ Error: {e}")
                
        return False
    
    def fetch_movies(self, page=1):
        """Fetch popular movies from TMDb"""
        try:
            url = f"{self.base_url}/movie/popular"
            params = {
                'api_key': self.api_key,
                'page': page
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json().get('results', [])
            else:
                print(f"API error: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            return []
    
    def fetch_movie_details(self, movie_id):
        """Fetch detailed movie information"""
        try:
            url = f"{self.base_url}/movie/{movie_id}"
            params = {
                'api_key': self.api_key,
                'append_to_response': 'credits'
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            return None
            
        except Exception as e:
            print(f"Error fetching movie {movie_id}: {e}")
            return None
    
    def save_movie(self, movie_data):
        """Save movie to database"""
        try:
            # Check if exists
            existing = self.db.query(Movie).filter(
                Movie.tmdb_id == movie_data['id']
            ).first()
            
            if existing:
                return False
            
            # Get details
            details = self.fetch_movie_details(movie_data['id'])
            if not details:
                return False
            
            # Extract data
            genres = [g['name'] for g in details.get('genres', [])]
            
            cast = []
            director = None
            if 'credits' in details:
                cast = [a['name'] for a in details['credits'].get('cast', [])[:10]]
                for crew in details['credits'].get('crew', []):
                    if crew['job'] == 'Director':
                        director = crew['name']
                        break
            
            # Create movie
            movie = Movie(
                tmdb_id=details['id'],
                title=details['title'],
                description=details.get('overview', ''),
                release_year=int(details.get('release_date', '2000')[:4]) if details.get('release_date') else None,
                duration=details.get('runtime'),
                rating=round(details.get('vote_average', 0.0), 1),
                genres=genres,
                poster_url=f"https://image.tmdb.org/t/p/w500{details.get('poster_path')}" if details.get('poster_path') else None,
                backdrop_url=f"https://image.tmdb.org/t/p/original{details.get('backdrop_path')}" if details.get('backdrop_path') else None,
                director=director,
                cast=cast,
                language=details.get('original_language', 'en'),
                popularity_score=details.get('popularity', 0.0),
                is_featured=(details.get('vote_average', 0) >= 7.5),
                content_type='movie'
            )
            
            self.db.add(movie)
            return True
            
        except Exception as e:
            print(f"Error saving movie: {e}")
            return False
    
    def load_movies(self, target_count=900):
        """Load movies from TMDb"""
        pages_needed = (target_count // 20) + 1
        loaded = 0
        
        print(f"\n📽️  Loading up to {target_count} movies...")
        print(f"   Will fetch {pages_needed} pages from TMDb")
        print("="*50)
        
        for page in range(1, pages_needed + 1):
            print(f"\n📄 Page {page}/{pages_needed}:")
            
            # Fetch movies
            movies = self.fetch_movies(page)
            if not movies:
                print("   ❌ Failed to fetch page")
                continue
            
            page_loaded = 0
            for movie_data in movies:
                print(f"   Processing: {movie_data.get('title', 'Unknown')[:40]:40}", end='')
                
                if self.save_movie(movie_data):
                    print(" ✅")
                    page_loaded += 1
                    loaded += 1
                else:
                    print(" ⏭️")
                
                # Rate limit
                time.sleep(0.3)
                
                if loaded >= target_count:
                    break
            
            # Commit after each page
            self.db.commit()
            print(f"   Page loaded: {page_loaded} new movies")
            
            if loaded >= target_count:
                break
            
            # Delay between pages
            time.sleep(1)
        
        print(f"\n✅ Total loaded: {loaded} movies")
        
        # Show database count
        total = self.db.query(Movie).count()
        print(f"📊 Total movies in database: {total}")
        
        return loaded
    
    def cleanup(self):
        """Close connections"""
        self.db.close()
        self.session.close()

def main():
    print("\n" + "="*50)
    print("🎬 STREAMIFY - SIMPLE MOVIE LOADER")
    print("="*50)
    
    loader = SimpleTMDbLoader()
    
    try:
        # Test API
        if not loader.test_api():
            print("\n⚠️  TMDb API connection issues detected")
            print("   Trying alternative approach...")
            time.sleep(2)
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables ready")
        
        # Check current count
        current = loader.db.query(Movie).count()
        print(f"📊 Current movies in database: {current}")
        
        if current >= 900:
            print("✅ Already have 900+ movies!")
            return
        
        # Load movies
        movies_to_load = 900 - current
        print(f"\n🎯 Need to load {movies_to_load} more movies")
        
        loaded = loader.load_movies(movies_to_load)
        
        print("\n" + "="*50)
        print("✅ Movie loading complete!")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Loading interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        loader.cleanup()

if __name__ == "__main__":
    main()
