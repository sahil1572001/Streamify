import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { authService } from '../../services/authService';

const API_URL = 'http://localhost:8080';

interface Movie {
  id: number;
  title: string;
  description: string;
  poster_url: string;
  rating: number;
  genres: string[];
  release_year: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'basic' | 'semantic'>('basic');
  const [searchTime, setSearchTime] = useState<number | null>(null);
  
  // Debounce timer
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Perform the actual search
  const performSearch = async (query: string) => {
    if (query.length < 2) {
      setMovies([]);
      setSearchTime(null);
      return;
    }

    setLoading(true);
    try {
      if (searchMode === 'semantic') {
        // Semantic search using vector similarity
        const token = await authService.getToken();
        if (!token) {
          Alert.alert('Sign In Required', 'Please sign in to use AI Search');
          setSearchMode('basic');
          setLoading(false);
          return;
        }
        
        console.log(`🔍 Semantic search with complete query: "${query}"`);
        const response = await axios.post(
          `${API_URL}/api/search/semantic`,
          {
            query: query,
            top_k: 20,
            use_profile: false  // Don't require user profile for search
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Semantic search response:', response.data);
        setMovies(response.data.movies || []);
        setSearchTime(response.data.search_time_ms);
      } else {
        // Basic keyword search
        console.log(`🔍 Basic search with complete query: "${query}"`);
        const response = await axios.get(`${API_URL}/api/movies/`, {
          params: { search: query, page_size: 20 }
        });
        console.log('✅ Basic search response:', response.data);
        setMovies(response.data.movies);
        setSearchTime(null);
      }
    } catch (error: any) {
      console.error('❌ Error searching movies:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 503) {
        Alert.alert(
          'AI Search Unavailable',
          'Semantic search requires API keys. Using basic search instead.'
        );
        setSearchMode('basic');
      } else if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please sign in again');
        setSearchMode('basic');
      } else {
        Alert.alert('Search Error', error.response?.data?.detail || 'Failed to search movies');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle text input with debouncing
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer - wait 800ms after user stops typing
    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 800);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity 
      style={styles.movieItem}
      onPress={() => router.push(`/movie/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.poster_url }}
        style={styles.moviePoster}
        resizeMode="cover"
      />
      <View style={styles.movieDetails}>
        <Text style={styles.movieTitle}>{item.title}</Text>
        <Text style={styles.movieYear}>{item.release_year}</Text>
        <View style={styles.genresContainer}>
          {item.genres.slice(0, 2).map((genre, index) => (
            <Text key={index} style={styles.genre}>
              {genre}
            </Text>
          ))}
        </View>
        <Text style={styles.movieDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#ffd700" />
          <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder={searchMode === 'semantic' ? 'Try: emotional sci-fi movies...' : 'Search movies...'}
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              searchMode === 'basic' && styles.modeButtonActive
            ]}
            onPress={() => setSearchMode('basic')}
          >
            <Ionicons 
              name="text-outline" 
              size={16} 
              color={searchMode === 'basic' ? '#fff' : '#888'} 
            />
            <Text style={[
              styles.modeButtonText,
              searchMode === 'basic' && styles.modeButtonTextActive
            ]}>Basic</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              searchMode === 'semantic' && styles.modeButtonActive
            ]}
            onPress={() => setSearchMode('semantic')}
          >
            <Ionicons 
              name="sparkles-outline" 
              size={16} 
              color={searchMode === 'semantic' ? '#fff' : '#888'} 
            />
            <Text style={[
              styles.modeButtonText,
              searchMode === 'semantic' && styles.modeButtonTextActive
            ]}>AI Search</Text>
          </TouchableOpacity>
        </View>
        
        {searchTime !== null && (
          <Text style={styles.searchTime}>
            Found {movies.length} results in {searchTime.toFixed(0)}ms
          </Text>
        )}
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : movies.length > 0 ? (
        <FlatList
          data={movies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.movieList}
          showsVerticalScrollIndicator={false}
        />
      ) : searchQuery.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="film-outline" size={64} color="#444" />
          <Text style={styles.emptyText}>No movies found</Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#444" />
          <Text style={styles.emptyText}>Search for movies</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchContainer: {
    padding: 20,
    paddingTop: 60,
    gap: 12,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  modeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  modeButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  searchTime: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
  },
  movieList: {
    padding: 20,
    paddingTop: 0,
  },
  movieItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  moviePoster: {
    width: 100,
    height: 150,
  },
  movieDetails: {
    flex: 1,
    padding: 12,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieYear: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  genre: {
    color: '#fff',
    fontSize: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  movieDescription: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '600',
  },
});
