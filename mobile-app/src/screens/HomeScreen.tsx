import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ImageBackground, Dimensions, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { getPopularMovies } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 300;

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [moviesByGenre, setMoviesByGenre] = useState<{[key: string]: Movie[]}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchMovies = async () => {
    try {
      console.log('Fetching movies...');
      const movies = await getPopularMovies();
      console.log('Movies loaded successfully:', movies.length);
      
      // Set featured movies (first 5)
      setFeaturedMovies(movies.slice(0, 5));
      
      // Group movies by genre
      const genreMap: {[key: string]: Movie[]} = {};
      movies.forEach(movie => {
        if (movie.genres && Array.isArray(movie.genres)) {
          movie.genres.forEach(genre => {
            if (!genreMap[genre]) genreMap[genre] = [];
            genreMap[genre].push(movie);
          });
        }
      });
      
      setMoviesByGenre(genreMap);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch movies:', err);
      setError(err?.message || 'Failed to load content. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <View style={styles.movieItemContainer}>
      <MovieCard 
        movie={item} 
        onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
        variant="default"
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4169E1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchMovies}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Custom header component for HomeScreen
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>STREAMIFY</Text>
        </View>
        <View style={styles.navItems}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Search', { query: '' })}
          >
            <Ionicons name="search-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/32' }} 
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroContainer}>
        {featuredMovies.length > 0 && featuredMovies[0]?.banner_url && (
          <ImageBackground 
            source={{ uri: featuredMovies[0].banner_url }}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Unlimited Movies, TV Shows, and More</Text>
                <Text style={styles.heroSubtitle}>Watch anywhere. Cancel anytime.</Text>
                <TouchableOpacity style={styles.heroButton}>
                  <Text style={styles.heroButtonText}>Watch Now</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>
        )}
      </View>

      {/* Featured Today Section - First section after header */}
      <View style={styles.firstSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Today</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={featuredMovies}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
              style={styles.featuredCard}
            />
          )}
          keyExtractor={(item) => `featured-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* Movies by Genre */}
      {Object.entries(moviesByGenre).map(([genre, movies]) => (
        <View key={genre} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{genre}</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={movies.slice(0, 10)}
            renderItem={({ item }) => (
              <MovieCard
                movie={item}
                onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
                style={styles.genreCard}
              />
            )}
            keyExtractor={(item) => `${genre}-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      ))}
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
    paddingTop: 0, // Remove padding since we'll handle spacing differently
  },
  // Header styles
  headerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingTop: 40,
    paddingBottom: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 90, // Fixed height for the header
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    color: '#00BFFF',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'System',
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  navItems: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navItem: {
    marginLeft: 20,
  },
  profileButton: {
    marginLeft: 20,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Hero Section - Removed marginTop since we want content to flow naturally
  heroContainer: {
    height: HERO_HEIGHT,
    marginBottom: 20,
    marginTop: -235, 
  },
  heroImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroContent: {
    maxWidth: '80%',
    marginBottom: 40,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.9,
  },
  heroButton: {
    backgroundColor: '#4169E1', // Royal Blue
    padding: 12,
    borderRadius: 5,
    width: 150,
    alignItems: 'center',
  },
  heroButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Sections
  section: {
    marginBottom: 25,
    // Add padding to the first section to account for the header
    // This will be overridden for the first section
  },
  // First section after header
  firstSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAll: {
    color: '#4169E1',
    fontSize: 14,
  },
  horizontalList: {
    paddingHorizontal: 10,
  },
  featuredCard: {
    width: width * 0.3,
    marginRight: 10,
  },
  genreCard: {
    width: width * 0.3,
    marginRight: 10,
  },
  movieItemContainer: {
    width: 120,
    marginRight: 15,
    marginBottom: 15,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#4169E1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
