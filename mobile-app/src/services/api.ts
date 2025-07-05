import axios from 'axios';
import { Movie, MovieDetails, BackendMovie, ApiResponse } from '../types';

// API configuration
// Use environment variable or default to local development URL
// For mobile testing, use your computer's IP address instead of localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.6:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to log requests (optional)
api.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    let errorMessage = 'Network error. Please check your connection and try again.';
    
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error('Response error:', {
        status: error.response.status,
        url: error.config?.url,
        message: error.message,
        data: error.response.data,
      });
      errorMessage = error.response.data?.message || errorMessage;
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      errorMessage = 'No response from server. Please try again.';
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      errorMessage = 'Request error. Please try again.';
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * Fetches a list of popular movies
 * @returns Promise with an array of popular movies
 */
export const getPopularMovies = async (): Promise<Movie[]> => {
  try {
    const response = await api.get<{success: boolean; results: BackendMovie[]; error?: string}>('/movies/popular');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch popular movies');
    }
    
    // Transform backend movie data to frontend Movie type
    return (response.data.results || []).map((movie: BackendMovie) => ({
      ...movie,
      overview: movie.description,
      release_date: movie.release_year ? movie.release_year.toString() : '',
      poster_path: movie.poster_url,
      backdrop_path: movie.banner_url,
      vote_average: movie.rating || 0,
      vote_count: 0, // Default value since not in backend model
      popularity: 0,  // Default value since not in backend model
      original_language: 'en', // Default value
      genres: movie.genre ? [movie.genre] : []
    }));
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw error;
  }
};

/**
 * Searches for movies based on a query string
 * @param query The search query
 * @returns Promise with an array of matching movies
 */
export const searchMovies = async (query: string): Promise<Movie[]> => {
  try {
    const response = await api.get<{ results: Movie[]; success: boolean }>('/movies/search', {
      params: { q: query },
    });
    
    if (response.data.success && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error) {
    console.error('Error searching movies:', error);
    throw new Error('Failed to search movies. Please try again.');
  }
};

/**
 * Fetches detailed information about a specific movie
 * @param movieId The ID of the movie
 * @returns Promise with the movie details
 */
export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
  try {
    console.log(`Fetching movie details for ID: ${movieId}`);
    const response = await api.get<{
      success: boolean;
      data: BackendMovie;
      error?: string;
    }>(`/movies/${movieId}`);
    
    if (!response.data.success) {
      console.error('API returned unsuccessful response:', response.data.error);
      throw new Error(response.data.error || 'Failed to fetch movie details');
    }

    const movie = response.data.data;
    console.log('Received movie data:', movie);
    
    // Transform cast data to match frontend's expected format
    const cast = (movie.cast || []).map(actor => ({
      id: actor.id,
      name: actor.name,
      character: 'Actor', // Default value since not provided by backend
      profile_path: actor.profile_url,
      order: 0 // Default order since not provided by backend
    }));

    // Debug log the raw similar_movies data
    console.log('[getMovieDetails] Raw similar_movies:', JSON.stringify(movie.similar_movies, null, 2));
    
    // Transform similar movies data to match frontend's expected format
    const similarMovies: Movie[] = [];
    
    if (Array.isArray(movie.similar_movies)) {
      movie.similar_movies.forEach((similar, index) => {
        try {
          if (!similar || typeof similar !== 'object') {
            console.warn(`[getMovieDetails] Invalid similar movie at index ${index}:`, similar);
            return;
          }
          
          // Ensure we have required fields
          if (similar.id === undefined || similar.id === null) {
            console.warn(`[getMovieDetails] Similar movie missing ID at index ${index}:`, similar);
            return;
          }
          
          // Create a properly formatted movie object for the frontend
          const similarMovie: Movie = {
            // Required Movie properties
            id: similar.id,
            title: similar.title || `Movie #${similar.id}`,
            overview: similar.overview || '',
            release_date: similar.release_year ? similar.release_year.toString() : '',
            genres: similar.genre ? [{ id: 0, name: similar.genre }] : [],
            
            // Backend fields
            description: similar.overview || '',
            release_year: similar.release_year || null,
            genre: similar.genre || null,
            rating: similar.rating || 0,
            poster_url: similar.poster_url || null,
            banner_url: similar.banner_url || null,
            video_url: similar.trailer_url || null,
            
            // TMDB fields with defaults
            poster_path: similar.poster_url || null,
            backdrop_path: similar.banner_url || null,
            vote_average: similar.rating || 0,
            vote_count: 0,
            popularity: 0,
            original_language: 'en',
            original_title: similar.title || `Movie #${similar.id}`,
            
            // Other fields with defaults
            runtime: 0,
            status: 'Released',
            tagline: '',
            imdb_id: '',
            video: false,
            adult: false,
            
            // Cast and credits (empty by default)
            cast: []
          };
          
          console.log(`[getMovieDetails] Processed similar movie ${index + 1}/${movie.similar_movies.length}:`, 
            JSON.stringify({
              id: similarMovie.id,
              title: similarMovie.title,
              poster_path: similarMovie.poster_path,
              release_date: similarMovie.release_date
            }, null, 2)
          );
          
          similarMovies.push(similarMovie);
          
        } catch (error) {
          console.error(`[getMovieDetails] Error processing similar movie at index ${index}:`, error, similar);
        }
      });
    }
    
    console.log(`[getMovieDetails] Processed ${similarMovies.length} similar movies`);
    
    // Create a complete movie details object with all required fields
    const movieDetails: MovieDetails = {
      ...movie,
      // Map backend fields to frontend fields
      overview: movie.overview || 'No overview available.',
      release_date: movie.release_year ? movie.release_year.toString() : 'N/A',
      poster_path: movie.poster_url || '',
      backdrop_path: movie.banner_url || '',
      vote_average: movie.rating || 0,
      vote_count: 0, // Default value since not in backend model
      popularity: 0,  // Default value since not in backend model
      original_language: 'en', // Default value
      genres: movie.genre ? [movie.genre] : [],
      recommendations: [], // Not provided by this endpoint
      similar_movies: similarMovies, // Add similar movies
      title: movie.title,
      id: movie.id,
      videos: {
        results: []
      },
      credits: {
        cast,
        crew: []
      },
      runtime: movie.duration || 0, // Using duration from backend as runtime
      status: 'Released', // Default value
      tagline: movie.tagline || '', // Default value
      original_title: movie.title, // Using title as fallback
      imdb_id: '', // Default value
      video: false, // Default value
      adult: false, // Default value
      production_companies: [], // Not provided by this endpoint
      production_countries: [], // Not provided by this endpoint
      spoken_languages: [] // Not provided by this endpoint
    };

    return movieDetails;
  } catch (error) {
    console.error(`Error fetching movie details for ID ${movieId}:`, error);
    
    // Return a basic movie object if we can't fetch details
    // Create a complete fallback MovieDetails object with all required properties
    const currentYear = new Date().getFullYear();
    const fallbackMovie: MovieDetails = {
      // Base Movie properties
      id: movieId,
      title: `Movie #${movieId}`,
      overview: 'Movie details could not be loaded.',
      poster_path: null,
      backdrop_path: null,
      vote_average: 0,
      vote_count: 0,
      popularity: 0,
      original_language: 'en',
      release_date: currentYear.toString(),
      genres: [],
      
      // BackendMovie properties
      description: 'Movie details could not be loaded.',
      release_year: currentYear,
      genre: null,
      rating: 0,
      poster_url: null,
      banner_url: null,
      video_url: null,
      duration: 0,
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // MovieDetails properties
      recommendations: [],
      similar_movies: [],
      videos: {
        results: []
      },
      credits: {
        cast: []
      },
      runtime: 0,
      status: 'Released',
      tagline: '',
      original_title: `Movie #${movieId}`,
      imdb_id: '',
      video: false,
      adult: false,
      production_companies: [],
      production_countries: [],
      spoken_languages: []
    };

    return fallbackMovie;
  }
};

/**
 * Fetches recommended movies based on a specific movie
 * @param movieId The ID of the movie to get recommendations for
 * @returns Promise with an array of recommended movies
 */
export const getMovieRecommendations = async (movieId: number): Promise<Movie[]> => {
  try {
    // First try the recommendations endpoint
    const response = await api.get<{ results: Movie[] }>(`/movies/${movieId}/recommendations`);
    return response.data.results;
  } catch (error: any) {
    console.warn('Recommendations endpoint not available, falling back to popular movies:', error.message);
    
    // If recommendations fail, fall back to popular movies
    try {
      const popularMovies = await getPopularMovies();
      // Filter out the current movie from recommendations
      return popularMovies.filter(movie => movie.id !== movieId).slice(0, 10);
    } catch (fallbackError) {
      console.error('Error fetching fallback popular movies:', fallbackError);
      return []; // Return empty array as last resort
    }
  }
};

/**
 * Fetches the cast and crew for a specific movie
 * @param movieId The ID of the movie
 * @returns Promise with the movie credits
 */
export const getMovieCredits = async (movieId: number) => {
  try {
    const response = await api.get<{ cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }> }>(`/movies/${movieId}/credits`);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching credits for movie ${movieId}:`, error);
    return { cast: [] };
  }
};

/**
 * Fetches trending data including popular movies and genres
 * @returns Promise with trending movies and genres
 */
export const getTrendingData = async (): Promise<{
  popularMovies: Movie[];
  popularGenres: string[];
  popularMovieTitles: string[];
}> => {
  try {
    // Get popular movies
    const popularMovies = await getPopularMovies();
    
    // Get unique genres from popular movies
    const allGenres = Array.from(
      new Set(
        popularMovies.flatMap(movie => 
          Array.isArray(movie.genres) 
            ? movie.genres.map(g => typeof g === 'string' ? g : g.name)
            : []
        )
      )
    );

    // Take top 5 most common genres
    const popularGenres = allGenres
      .filter(genre => genre && genre.length > 0)
      .slice(0, 5);

    // Add some default genres if we don't have enough
    const defaultGenres = ['Action', 'Comedy', 'Drama', 'Thriller', 'Sci-Fi'];
    const finalGenres = [...new Set([...popularGenres, ...defaultGenres])].slice(0, 5);

    // Get top 5 popular movie titles
    const popularMovieTitles = popularMovies
      .map(movie => movie.title)
      .filter((title): title is string => !!title)
      .slice(0, 5);

    return {
      popularMovies: popularMovies.slice(0, 5), // Return first 5 popular movies
      popularGenres: finalGenres,
      popularMovieTitles,
    };
  } catch (error) {
    console.error('Error fetching trending data:', error);
    // Return default values in case of error
    return {
      popularMovies: [],
      popularGenres: ['Action', 'Comedy', 'Drama', 'Thriller', 'Sci-Fi'],
      popularMovieTitles: [],
    };
  }
};

const apiService = {
  getPopularMovies,
  searchMovies,
  getMovieDetails,
  getTrendingData,
  getMovieRecommendations,
  getMovieCredits,
};

export default apiService;