// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080',
  ENDPOINTS: {
    MOVIES: '/api/movies',
    FEATURED: '/api/movies/featured',
    TRENDING: '/api/movies/trending',
    TOP_RATED: '/api/movies/top-rated',
    WATCHLIST: '/api/watchlist',
    REVIEWS: '/api/reviews',
    AUTH: '/api/auth',
  },
};

export default API_CONFIG;
