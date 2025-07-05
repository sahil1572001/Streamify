export interface Genre {
  id: number;
  name: string;
}

// Backend Movie Model (matches the Flask SQLAlchemy model)
export interface BackendMovie {
  id: number;
  title: string;
  description: string;
  overview?: string; // Some endpoints might return this as overview instead of description
  release_year: number | null;
  genre: string | null;
  rating: number | null;
  poster_url: string | null;
  banner_url: string | null;
  video_url: string | null;
  duration: number | null;
  language: string;
  created_at: string;
  updated_at: string;
  
  // Additional fields that might be returned by the API
  runtime?: number;
  status?: string;
  tagline?: string;
  original_title?: string;
  imdb_id?: string;
  video?: boolean;
  adult?: boolean;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path?: string | null;
    origin_country?: string;
  }>;
  production_countries?: Array<{
    iso_3166_1: string;
    name: string;
  }>;
  spoken_languages?: Array<{
    english_name: string;
    iso_639_1: string;
    name: string;
  }>;
  
  // Cast information that might be included in the movie details
  cast?: Array<{
    id: number;
    name: string;
    character?: string;
    profile_url: string | null;
  }>;
  
  // Similar movies that might be included in the response
  similar_movies?: Array<{
    id: number;
    title: string;
    poster_url: string | null;
    banner_url: string | null;
    overview?: string;
    release_year: number | null;
    rating: number | null;
    genre: string | null;
    trailer_url?: string | null;
  }>;
}

// Base movie interface with common properties
export interface BaseMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  genres?: string[];
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  original_title?: string;
  video?: boolean;
  adult?: boolean;
  runtime?: number | null;
  status?: string;
  tagline?: string;
  imdb_id?: string;
  
  // Backend specific fields
  description?: string;
  release_year?: number | null;
  genre?: string | null;
  rating?: number | null;
  poster_url?: string | null;
  banner_url?: string | null;
  video_url?: string | null;
  duration?: number | null;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

// Frontend Movie type (compatible with both TMDB and our backend)
export interface Movie {
  // Core movie properties
  id: number;
  title: string;
  overview: string;
  release_date: string;
  genres: Array<{ id: number; name: string }>;
  
  // TMDB fields
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  original_title: string;
  video: boolean;
  adult: boolean;
  runtime: number | null;
  status: string;
  tagline: string;
  imdb_id: string;
  
  // Backend specific fields
  description: string;
  release_year: number | null;
  genre: string | null;
  rating: number | null;
  poster_url: string | null;
  banner_url: string | null;
  video_url: string | null;
  duration: number | null;
  language: string;
  
  // Cast and crew
  cast?: Array<{
    id: number;
    name: string;
    character?: string;
    profile_path?: string | null;
  }>;
  
  // Similar movies
  similar_movies?: Movie[];
  similar?: Movie[]; // Alias for similar_movies for compatibility
  
  // For type compatibility with other components
  [key: string]: any;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface MovieDetails extends BaseMovie {
  // These are required for MovieDetails
  description: string;
  release_year: number | null;
  genre: string | null;
  
  // Full credits information
  credits: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      profile_path: string | null;
    }>;
  };
  
  // Similar movies with full details
  similar_movies: Movie[];
  // Rating is already defined in the base Movie interface
  poster_url: string | null;
  banner_url: string | null;
  video_url: string | null;
  duration: number | null;
  language: string;
  created_at: string;
  updated_at: string;
  
  // Additional properties
  recommendations: Movie[];
  similar?: Movie[];
  similar_movies?: Movie[];
  videos?: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }>;
  };
  runtime: number;
  status: string;
  tagline: string;
  imdb_id: string;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }>;
  production_countries: Array<{
    iso_3166_1: string;
    name: string;
  }>;
  spoken_languages: Array<{
    english_name: string;
    iso_639_1: string;
    name: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  results?: T[];
  result?: T;
  count?: number;
  error?: string;
}

export type RootStackParamList = {
  Home: undefined;
  Search: { query?: string };
  MovieDetail: { movieId: number };
  GenreMovies: { genre: string };
};