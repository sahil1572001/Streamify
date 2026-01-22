import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  FlatList,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import MovieCard from '../../components/MovieCard';
import { authService } from '../../services/authService';

const API_URL = 'http://localhost:8080';

interface Movie {
  id: number;
  title: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  rating: number;
  genres: string[];
  release_year: number;
  duration?: number;
  director?: string;
  cast?: string[];
  language?: string;
  country?: string;
  imdb_rating?: number;
  content_type?: string;
  trailer_url?: string;
}

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1200;

  useEffect(() => {
    if (id) {
      fetchMovieDetails();
      fetchSimilarMovies();
    }
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/movies/${id}`);
      setMovie(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      setLoading(false);
    }
  };

  const fetchSimilarMovies = async () => {
    try {
      // Use AI-powered similar movies endpoint
      const response = await axios.get(`${API_URL}/api/search/similar/${id}`, {
        params: { limit: 10 },
      });
      setSimilarMovies(response.data);
    } catch (error) {
      console.error('Error fetching similar movies:', error);
      // Fallback to basic genre-based search
      try {
        const fallback = await axios.get(`${API_URL}/api/movies/`, {
          params: { page_size: 10 },
        });
        setSimilarMovies(fallback.data.movies.slice(0, 10));
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  };

  const handleWatchlistToggle = async () => {
    try {
      const token = await authService.getToken();
      if (!token) {
        Alert.alert('Sign In Required', 'Please sign in to manage your watchlist');
        return;
      }
      
      if (inWatchlist) {
        // Remove from watchlist
        await axios.delete(`${API_URL}/api/watchlist/${movie?.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Add to watchlist
        await axios.post(
          `${API_URL}/api/watchlist/`,
          { movie_id: movie?.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      setInWatchlist(!inWatchlist);
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      Alert.alert('Error', 'Failed to update watchlist');
    }
  };

  const handleMoviePress = (movieId: number) => {
    router.push(`/movie/${movieId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Movie not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={[styles.heroSection, { height: isMobile ? 300 : isTablet ? 400 : 500 }]}>
        <Image
          source={{ uri: movie.backdrop_url || movie.poster_url }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
          style={styles.heroGradient}
        >
          <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Movie Info */}
      <View style={[styles.content, { paddingHorizontal: isMobile ? 16 : 24 }]}>
        {/* Title and Rating */}
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: isMobile ? 28 : 36 }]}>{movie.title}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.rating}>{movie.rating.toFixed(1)}</Text>
            {movie.imdb_rating && (
              <Text style={styles.imdbRating}>IMDb: {movie.imdb_rating.toFixed(1)}</Text>
            )}
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>{movie.release_year}</Text>
          {movie.duration && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.metadataText}>{movie.duration} min</Text>
            </>
          )}
          {movie.content_type && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.metadataText}>
                {movie.content_type === 'tv' ? 'TV Series' : 'Movie'}
              </Text>
            </>
          )}
          {movie.language && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.metadataText}>{movie.language}</Text>
            </>
          )}
        </View>

        {/* Genres */}
        {movie.genres && movie.genres.length > 0 && (
          <View style={styles.genresContainer}>
            {movie.genres.map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { flexDirection: isMobile ? 'column' : 'row' }]}>
          <TouchableOpacity
            style={[styles.watchlistBtn, { flex: isMobile ? 0 : 1 }]}
            onPress={handleWatchlistToggle}
          >
            <Ionicons
              name={inWatchlist ? 'checkmark-circle' : 'add-circle-outline'}
              size={24}
              color="#fff"
            />
            <Text style={styles.watchlistBtnText}>
              {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </Text>
          </TouchableOpacity>
          {movie.trailer_url && (
            <TouchableOpacity style={[styles.trailerBtn, { flex: isMobile ? 0 : 1 }]}>
              <Ionicons name="play-circle-outline" size={24} color="#fff" />
              <Text style={styles.trailerBtnText}>Watch Trailer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synopsis</Text>
          <Text style={styles.description}>{movie.description}</Text>
        </View>

        {/* Cast & Crew */}
        {(movie.director || (movie.cast && movie.cast.length > 0)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cast & Crew</Text>
            {movie.director && (
              <View style={styles.crewItem}>
                <Text style={styles.crewLabel}>Director:</Text>
                <Text style={styles.crewValue}>{movie.director}</Text>
              </View>
            )}
            {movie.cast && movie.cast.length > 0 && (
              <View style={styles.crewItem}>
                <Text style={styles.crewLabel}>Cast:</Text>
                <Text style={styles.crewValue}>{movie.cast.slice(0, 5).join(', ')}</Text>
              </View>
            )}
            {movie.country && (
              <View style={styles.crewItem}>
                <Text style={styles.crewLabel}>Country:</Text>
                <Text style={styles.crewValue}>{movie.country}</Text>
              </View>
            )}
          </View>
        )}

        {/* Similar Movies */}
        {similarMovies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Movies</Text>
            <FlatList
              data={similarMovies}
              renderItem={({ item }) => (
                <MovieCard
                  movie={item}
                  onPress={() => handleMoviePress(item.id)}
                  cardWidth={isMobile ? 140 : 160}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarMoviesList}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroSection: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-start',
    padding: 20,
  },
  backIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  content: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  imdbRating: {
    fontSize: 14,
    color: '#aaa',
    marginLeft: 8,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  metadataText: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  dot: {
    fontSize: 14,
    color: '#666',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  genreTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  genreText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  watchlistBtn: {
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  watchlistBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trailerBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  trailerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
  },
  crewItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  crewLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    width: 80,
  },
  crewValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  similarMoviesList: {
    paddingRight: 20,
  },
});
