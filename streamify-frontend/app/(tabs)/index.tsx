import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
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
}

export default function HomeScreen() {
  const router = useRouter();
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<Movie[]>([]);
  const [animationMovies, setAnimationMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const { width: windowWidth } = useWindowDimensions();
  
  // Refs for scrolling movie rows
  const featuredRef = useRef<FlatList>(null);
  const trendingRef = useRef<FlatList>(null);
  const topRatedRef = useRef<FlatList>(null);
  const recommendedRef = useRef<FlatList>(null);
  const actionRef = useRef<FlatList>(null);
  const comedyRef = useRef<FlatList>(null);
  const horrorRef = useRef<FlatList>(null);
  const animationRef = useRef<FlatList>(null);

  const responsiveValues = useMemo(() => {
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1200;

    const heroHeight = isMobile ? 420 : isTablet ? 520 : 640;
    const heroTitleSize = isMobile ? 28 : isTablet ? 40 : 48;
    const heroDescriptionSize = isMobile ? 14 : 16;
    const heroDescriptionLines = isMobile ? 2 : 3;
    const heroPadding = isMobile ? 16 : 24;
    const heroHorizontalPadding = heroPadding * 2;
    const heroContentWidth = isMobile
      ? Math.max(windowWidth - heroHorizontalPadding, 280)
      : isTablet
        ? Math.min(windowWidth - heroHorizontalPadding, 640)
        : 720;

    const cardWidth = isMobile
      ? Math.max(windowWidth * 0.38, 120)
      : isTablet
        ? Math.max(windowWidth * 0.22, 150)
        : 180;
    const cardHeight = cardWidth * 1.5;

    const sectionHorizontalPadding = isMobile ? 12 : 20;

    return {
      heroHeight,
      heroTitleSize,
      heroDescriptionSize,
      heroDescriptionLines,
      heroPadding,
      heroHorizontalPadding,
      heroContentWidth,
      cardWidth,
      cardHeight,
      sectionHorizontalPadding,
    };
  }, [windowWidth]);

  useEffect(() => {
    fetchMovies();
  }, []);

  // Refetch recommendations whenever the home tab is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🏠 Home tab focused - refreshing recommendations');
      fetchRecommendations();
    }, [])
  );

  const fetchMovies = async () => {
    try {
      const [featured, trending, topRated, action, comedy, horror, animation] = await Promise.all([
        axios.get(`${API_URL}/api/movies/featured`),
        axios.get(`${API_URL}/api/movies/trending`),
        axios.get(`${API_URL}/api/movies/top-rated`),
        axios.get(`${API_URL}/api/movies/by-genre?genre=Action&limit=20`),
        axios.get(`${API_URL}/api/movies/by-genre?genre=Comedy&limit=20`),
        axios.get(`${API_URL}/api/movies/by-genre?genre=Horror&limit=20`),
        axios.get(`${API_URL}/api/movies/by-genre?genre=Animation&limit=20`),
      ]);

      setFeaturedMovies(featured.data);
      setTrendingMovies(trending.data);
      setTopRatedMovies(topRated.data);
      setActionMovies(action.data);
      setComedyMovies(comedy.data);
      setHorrorMovies(horror.data);
      setAnimationMovies(animation.data);
      
      if (featured.data.length > 0) {
        setHeroMovie(featured.data[0]);
      }
      
      // Fetch AI recommendations (optional - requires auth)
      fetchRecommendations();
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = await authService.getToken();
      if (!token) {
        // User not signed in - skip recommendations
        console.log('⚠️ No token - skipping recommendations');
        return;
      }
      
      console.log('🔄 Fetching personalized recommendations based on watchlist...');
      const response = await axios.post(
        `${API_URL}/api/search/recommendations`,
        { top_k: 20 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.length > 0) {
        setRecommendedMovies(response.data);
        console.log(`✅ Loaded ${response.data.length} personalized recommendations`);
        console.log('📺 Recommendations:', response.data.map((m: any) => m.title).join(', '));
      } else {
        console.log('⚠️ No recommendations returned - user vector may be initializing');
        setRecommendedMovies([]);
      }
    } catch (error: any) {
      // Silently fail - recommendations are optional
      console.log('⚠️ Recommendations not available:', error.response?.data?.detail || error.message);
      setRecommendedMovies([]);
    }
  };

  const handleMoviePress = (movieId: number) => {
    router.push(`/movie/${movieId}` as any);
  };

  const handleWatchlistPress = async (movieId: number) => {
    try {
      const token = await authService.getToken();
      if (!token) {
        Alert.alert('Sign In Required', 'Please sign in to add to watchlist');
        return;
      }
      
      console.log(`📌 Adding movie ${movieId} to watchlist...`);
      const response = await axios.post(
        `${API_URL}/api/watchlist/`,
        { movie_id: movieId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Movie added to watchlist:', response.data);
      
      // Refresh recommendations immediately after adding to watchlist
      await fetchRecommendations();
      
      Alert.alert('Success', 'Added to watchlist! Recommendations updated.');
    } catch (error) {
      console.error('❌ Error adding to watchlist:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Status:', error.response?.status);
        console.error('Error detail:', error.response?.data?.detail);
        
        const errorMsg = error.response?.data?.detail || 'Failed to add to watchlist';
        Alert.alert('Error', errorMsg);
      } else {
        Alert.alert('Error', 'Failed to add to watchlist');
      }
    }
  };

  const renderMovieCard = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={[styles.movieCard, { width: responsiveValues.cardWidth }]}
      activeOpacity={0.85}
      onPress={() => handleMoviePress(item.id)}
    >
      <Image
        source={{ uri: item.poster_url }}
        style={[
          styles.moviePoster,
          {
            width: responsiveValues.cardWidth,
            height: responsiveValues.cardHeight,
          },
        ]}
        resizeMode="cover"
      />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>★ {item.rating.toFixed(1)}</Text>
        </View>
      </View>
      
      {/* Watchlist Button */}
      <TouchableOpacity
        style={styles.watchlistButton}
        onPress={(e) => {
          e.stopPropagation();
          handleWatchlistPress(item.id);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle" size={32} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMovieRow = (title: string, movies: Movie[], flatListRef: React.RefObject<FlatList | null>) => {
    const scrollLeft = () => {
      flatListRef.current?.scrollToOffset({
        offset: Math.max(0, responsiveValues.cardWidth * -3),
        animated: true,
      });
    };

    const scrollRight = () => {
      flatListRef.current?.scrollToOffset({
        offset: responsiveValues.cardWidth * 3,
        animated: true,
      });
    };

    return (
      <View style={styles.movieRow}>
        <View style={styles.rowHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { paddingHorizontal: responsiveValues.sectionHorizontalPadding },
            ]}
          >
            {title}
          </Text>
          <View style={styles.scrollButtons}>
            <TouchableOpacity style={styles.scrollButton} onPress={scrollLeft}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.scrollButton} onPress={scrollRight}>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          ref={flatListRef}
          data={movies}
          renderItem={renderMovieCard}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.movieList,
            { paddingHorizontal: responsiveValues.sectionHorizontalPadding },
          ]}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section - Apple TV Style */}
      {heroMovie && (
        <View style={[styles.heroSection, { height: responsiveValues.heroHeight }]}
        >
          <Image
            source={{ uri: heroMovie.backdrop_url }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', '#000']}
            style={styles.heroGradient}
          >
            <View
              style={[
                styles.heroContent,
                {
                  maxWidth: responsiveValues.heroContentWidth,
                  paddingHorizontal: responsiveValues.heroPadding,
                },
              ]}
            >
              <Text style={[styles.heroTitle, { fontSize: responsiveValues.heroTitleSize }]}>
                {heroMovie.title}
              </Text>
              <Text
                style={[styles.heroDescription, { fontSize: responsiveValues.heroDescriptionSize }]}
                numberOfLines={responsiveValues.heroDescriptionLines}
              >
                {heroMovie.description}
              </Text>
              <View style={[styles.heroGenres, { flexWrap: 'wrap', gap: 8 }]}>
                {heroMovie.genres.slice(0, 3).map((genre, index) => (
                  <View key={index} style={styles.genreTag}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.heroButtons, { flexWrap: 'wrap' }]}>
                <TouchableOpacity 
                  style={styles.moreInfoButton} 
                  activeOpacity={0.85}
                  onPress={() => handleMoviePress(heroMovie.id)}
                >
                  <Text style={styles.moreInfoButtonText}>More Info</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Movie Rows */}
      <View style={styles.content}>
        {recommendedMovies.length > 0 && renderMovieRow('🤖 Recommended For You', recommendedMovies, recommendedRef)}
        {renderMovieRow('⭐ Featured', featuredMovies, featuredRef)}
        {renderMovieRow('🔥 Trending Now', trendingMovies, trendingRef)}
        {renderMovieRow('👑 Top Rated', topRatedMovies, topRatedRef)}
        {actionMovies.length > 0 && renderMovieRow('💥 Action', actionMovies, actionRef)}
        {comedyMovies.length > 0 && renderMovieRow('😂 Comedy', comedyMovies, comedyRef)}
        {horrorMovies.length > 0 && renderMovieRow('👻 Horror', horrorMovies, horrorRef)}
        {animationMovies.length > 0 && renderMovieRow('🎨 Animation', animationMovies, animationRef)}
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
  heroSection: {
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  heroContent: {
    width: '100%',
  },
  heroTitle: {
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  heroDescription: {
    color: '#e0e0e0',
    marginBottom: 16,
    lineHeight: 24,
  },
  heroGenres: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  genreTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  genreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  moreInfoButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  moreInfoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingBottom: 40,
  },
  movieRow: {
    marginBottom: 32,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
  },
  scrollButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
  scrollButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieList: {
    paddingHorizontal: 20,
  },
  movieCard: {
    marginRight: 12,
  },
  moviePoster: {
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  movieInfo: {
    marginTop: 8,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '600',
  },
  watchlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 4,
  },
});
