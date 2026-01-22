"""
TMDB API Integration Service
Fetches movie and TV show data from The Movie Database API
"""
import requests
from typing import List, Dict, Optional
from ..config import settings

class TMDBService:
    BASE_URL = "https://api.themoviedb.org/3"
    IMAGE_BASE_URL = "https://image.tmdb.org/t/p"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.tmdb_api_key
        if not self.api_key:
            raise ValueError("TMDB API key is required. Set TMDB_API_KEY in .env file")
        self.language = settings.tmdb_language
        
        # Reuse session for connection pooling
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': 'Streamify/1.0'
        })
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make a request to TMDB API"""
        if params is None:
            params = {}
        
        params['api_key'] = self.api_key
        params['language'] = self.language
        
        url = f"{self.BASE_URL}/{endpoint}"
        response = self.session.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    
    def get_poster_url(self, poster_path: str, size: str = "w500") -> str:
        """Get full poster URL"""
        if not poster_path:
            return ""
        return f"{self.IMAGE_BASE_URL}/{size}{poster_path}"
    
    def get_backdrop_url(self, backdrop_path: str, size: str = "original") -> str:
        """Get full backdrop URL"""
        if not backdrop_path:
            return ""
        return f"{self.IMAGE_BASE_URL}/{size}{backdrop_path}"
    
    # ==================== MOVIES ====================
    
    def get_popular_movies(self, page: int = 1) -> Dict:
        """Get popular movies"""
        return self._make_request("movie/popular", {"page": page})
    
    def get_top_rated_movies(self, page: int = 1) -> Dict:
        """Get top rated movies"""
        return self._make_request("movie/top_rated", {"page": page})
    
    def get_now_playing_movies(self, page: int = 1) -> Dict:
        """Get now playing movies"""
        return self._make_request("movie/now_playing", {"page": page})
    
    def get_upcoming_movies(self, page: int = 1) -> Dict:
        """Get upcoming movies"""
        return self._make_request("movie/upcoming", {"page": page})
    
    def get_movie_details(self, movie_id: int) -> Dict:
        """Get detailed information about a movie"""
        return self._make_request(f"movie/{movie_id}", {
            "append_to_response": "credits,videos,keywords,similar"
        })
    
    def discover_movies(self, **kwargs) -> Dict:
        """
        Discover movies with filters
        Args:
            sort_by: Sort results (e.g., 'popularity.desc', 'vote_average.desc')
            with_genres: Genre IDs (comma-separated)
            primary_release_year: Filter by year
            vote_average_gte: Minimum rating
            page: Page number
        """
        return self._make_request("discover/movie", kwargs)
    
    # ==================== TV SHOWS ====================
    
    def get_popular_tv_shows(self, page: int = 1) -> Dict:
        """Get popular TV shows"""
        return self._make_request("tv/popular", {"page": page})
    
    def get_top_rated_tv_shows(self, page: int = 1) -> Dict:
        """Get top rated TV shows"""
        return self._make_request("tv/top_rated", {"page": page})
    
    def get_airing_today_tv_shows(self, page: int = 1) -> Dict:
        """Get TV shows airing today"""
        return self._make_request("tv/airing_today", {"page": page})
    
    def get_on_the_air_tv_shows(self, page: int = 1) -> Dict:
        """Get TV shows currently on the air"""
        return self._make_request("tv/on_the_air", {"page": page})
    
    def get_tv_show_details(self, tv_id: int) -> Dict:
        """Get detailed information about a TV show"""
        return self._make_request(f"tv/{tv_id}", {
            "append_to_response": "credits,videos,keywords,similar"
        })
    
    def discover_tv_shows(self, **kwargs) -> Dict:
        """
        Discover TV shows with filters
        Args:
            sort_by: Sort results
            with_genres: Genre IDs
            first_air_date_year: Filter by year
            vote_average_gte: Minimum rating
            page: Page number
        """
        return self._make_request("discover/tv", kwargs)
    
    # ==================== GENRES ====================
    
    def get_movie_genres(self) -> List[Dict]:
        """Get list of movie genres"""
        result = self._make_request("genre/movie/list")
        return result.get('genres', [])
    
    def get_tv_genres(self) -> List[Dict]:
        """Get list of TV genres"""
        result = self._make_request("genre/tv/list")
        return result.get('genres', [])
    
    # ==================== SEARCH ====================
    
    def search_movies(self, query: str, page: int = 1) -> Dict:
        """Search for movies"""
        return self._make_request("search/movie", {"query": query, "page": page})
    
    def search_tv_shows(self, query: str, page: int = 1) -> Dict:
        """Search for TV shows"""
        return self._make_request("search/tv", {"query": query, "page": page})
    
    def search_multi(self, query: str, page: int = 1) -> Dict:
        """Search for movies, TV shows, and people"""
        return self._make_request("search/multi", {"query": query, "page": page})
