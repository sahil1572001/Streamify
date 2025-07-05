import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { searchMovies, getTrendingData } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

const SearchScreen = ({ navigation, route }: Props) => {
  const [searchQuery, setSearchQuery] = useState(route.params?.query || '');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [trendingData, setTrendingData] = useState<{
    popularGenres: string[];
    popularMovieTitles: string[];
  }>({ popularGenres: [], popularMovieTitles: [] });
  const [loadingTrending, setLoadingTrending] = useState(true);

  const saveToHistory = async (query: string) => {
    if (!query) return;
    try {
      const prev = await AsyncStorage.getItem('search_history');
      let updated = prev ? JSON.parse(prev) : [];
      updated = [query, ...updated.filter((item: string) => item !== query)].slice(0, 6);
      await AsyncStorage.setItem('search_history', JSON.stringify(updated));
      setHistory(updated);
    } catch (e) {
      console.warn('Failed to save history');
    }
  };

  const loadHistory = async () => {
    try {
      const prev = await AsyncStorage.getItem('search_history');
      if (prev) setHistory(JSON.parse(prev));
    } catch (e) {
      console.warn('Failed to load history');
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const results = await searchMovies(query);
      setSearchResults(results);
      if (results.length === 0) {
        setError('No movies found. Try a different search term.');
      } else {
        saveToHistory(query);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInput = (text: string) => {
    setSearchQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      performSearch(text);
    }, 400);
    setDebounceTimer(timer);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError('');
    Keyboard.dismiss();
  };

  // List of genre names that should navigate to genre results
  const GENRES = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 
    'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'];

  const handleQuickSearch = (term: string) => {
    const normalizedTerm = term.toLowerCase();
    // Check if the term is a genre
    if (GENRES.some(genre => genre.toLowerCase() === normalizedTerm)) {
      // Navigate to genre results
      navigation.navigate('GenreMovies', { genre: term });
    } else {
      // Perform regular search for movie titles
      setSearchQuery(term);
      performSearch(term);
    }
  };

  const renderMovieItem = useCallback(
    ({ item }: { item: Movie }) => (
      <TouchableOpacity
        onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
        style={styles.thumbnailContainer}
      >
        <MovieCard
          movie={item}
          variant="default"
        />
      </TouchableOpacity>
    ),
    [navigation]
  );

  useEffect(() => {
    loadHistory();
    fetchTrendingData();
  }, []);

  const fetchTrendingData = async () => {
    try {
      setLoadingTrending(true);
      const data = await getTrendingData();
      setTrendingData({
        popularGenres: data.popularGenres,
        popularMovieTitles: data.popularMovieTitles
      });
    } catch (error) {
      console.error('Error fetching trending data:', error);
      // Fallback to default values
      setTrendingData({
        popularGenres: ['Action', 'Comedy', 'Drama', 'Thriller', 'Sci-Fi'],
        popularMovieTitles: []
      });
    } finally {
      setLoadingTrending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Search Header */}
      <View style={styles.searchHeaderContainer}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.searchHeader}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <BlurView intensity={30} tint="dark" style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color="#999" style={{ marginLeft: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for movies..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={handleSearchInput}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={handleClear}>
                  <Ionicons name="close-circle" size={20} color="#999" style={{ marginRight: 8 }} />
                </TouchableOpacity>
              )}
            </BlurView>
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {!searchQuery ? (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {loadingTrending ? (
              <View style={styles.centered}>
                <ActivityIndicator size="small" color="#E50914" />
              </View>
            ) : (
              <>
                {trendingData.popularMovieTitles.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Trending Movies</Text>
                    <View style={styles.tagsContainer}>
                      {trendingData.popularMovieTitles.map((title) => (
                        <TouchableOpacity
                          key={title}
                          style={styles.tag}
                          onPress={() => handleQuickSearch(title)}
                        >
                          <Text style={styles.tagText}>{title}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
                
                {trendingData.popularGenres.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Popular Genres</Text>
                    <View style={styles.tagsContainer}>
                      {trendingData.popularGenres.map((genre) => (
                        <TouchableOpacity
                          key={genre}
                          style={styles.tag}
                          onPress={() => handleQuickSearch(genre)}
                        >
                          <Text style={styles.tagText}>{genre}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {history.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Recent Searches</Text>
                    <View style={styles.tagsContainer}>
                      {history.map((term) => (
                        <TouchableOpacity
                          key={term}
                          style={styles.tag}
                          onPress={() => handleQuickSearch(term)}
                        >
                          <Text style={styles.tagText}>{term}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
        ) : (
          // Search Results
          <View style={styles.searchResultsContainer}>
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#E50914" />
              </View>
            ) : error ? (
              <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={50} color="#E50914" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderMovieItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - CARD_MARGIN * 4) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchHeaderContainer: {
    backgroundColor: '#000',
    paddingTop: 30,
    paddingBottom: 8,
    zIndex: 10,
    elevation: 10,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  // container is now at the top of the styles
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    flex: 1,
    height: 40,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
    paddingHorizontal: 12,
  },
  searchResultsContainer: {
    flex: 1,
    paddingTop: 8,
  },
  // Removed tagScroll as we're using scrollView now
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  loadingIndicator: {
    marginVertical: 20,
  },
  tagText: {
    color: '#ddd',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  list: {
    padding: 8,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: CARD_MARGIN * 1.5,
  },
  thumbnailContainer: {
    width: CARD_WIDTH,
    marginBottom: CARD_MARGIN,
  },
  errorText: {
    color: '#E50914',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
});

export default SearchScreen;
