import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity, 
  Linking, 
  Dimensions,
  Modal,
  Pressable
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { RootStackParamList, Movie } from '../types';

type Cast = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};
import { getMovieDetails, getMovieRecommendations, getMovieCredits } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import MovieList from '../components/MovieList';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'MovieDetail'>;

const MovieDetailScreen = ({ route, navigation }: Props) => {
  // State to track if back button is pressed
  const [showBackdrop, setShowBackdrop] = useState(false);
  
  // Hide the default header to prevent duplicate back buttons
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);
  
  const { movieId } = route.params;
  const [movie, setMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [cast, setCast] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoVisible, setVideoVisible] = useState(false);

  const fetchMovieData = async () => {
    try {
      console.log('Starting to fetch movie data for ID:', movieId);
      setLoading(true);
      setError('');
      
      // Log API base URL
      console.log('API Base URL:', process.env.REACT_APP_API_URL || 'Using default URL');
      
      // Fetch only movie details (credits are included in the response)
      console.log('Fetching movie details for ID:', movieId);
      const movieData = await getMovieDetails(movieId);
      console.log('Movie details response:', movieData);
      
      // Transform movie data to match Movie type
      const transformedMovie: Movie = {
        ...movieData,
        // Ensure all required Movie properties are set with proper types
        id: movieData.id,
        title: movieData.title,
        overview: movieData.overview || movieData.description || '',
        release_date: movieData.release_date || (movieData.release_year ? movieData.release_year.toString() : ''),
        // Handle genres - could be string[], {id: number, name: string}[], or undefined
        genres: Array.isArray(movieData.genres) 
          ? movieData.genres.map((genre: string | { id: number; name: string }, index) => {
              if (typeof genre === 'string') {
                return { id: index, name: genre };
              } else if (genre && typeof genre === 'object') {
                return { id: genre.id || index, name: genre.name || '' };
              }
              return { id: index, name: '' };
            })
          : [],
        poster_path: movieData.poster_path || movieData.poster_url || null,
        backdrop_path: movieData.backdrop_path || movieData.banner_url || null,
        vote_average: movieData.vote_average || 0,
        vote_count: movieData.vote_count || 0,
        popularity: movieData.popularity || 0,
        original_language: movieData.original_language || 'en',
        original_title: movieData.original_title || movieData.title,
        video: movieData.video || false,
        adult: movieData.adult || false,
        runtime: movieData.runtime || null,
        status: movieData.status || 'Released',
        tagline: movieData.tagline || '',
        imdb_id: movieData.imdb_id || '',
        description: movieData.description || movieData.overview || '',
        // Explicitly set rating to null if undefined to match Movie type
        rating: movieData.rating ?? null,
        // Set genre to null if undefined to match Movie type
        genre: movieData.genre ?? null
      } as Movie; // Use type assertion to ensure type safety
      
      // Set movie data
      setMovie(transformedMovie);
      
      // Set cast if available in the response
      if (movieData.credits?.cast) {
        // Map the cast to include the required order property
        const formattedCast = movieData.credits.cast.map((member, index) => ({
          ...member,
          order: index // Use the array index as the order
        }));
        setCast(formattedCast);
      }
      
      // Debug log the entire movie data
      console.log('Movie data received:', JSON.stringify(movieData, null, 2));
      
      // Check if similar_movies exists and has items
      if (movieData.similar_movies && Array.isArray(movieData.similar_movies) && movieData.similar_movies.length > 0) {
        console.log('Found similar movies:', movieData.similar_movies.length);
        console.log('Sample similar movie:', JSON.stringify(movieData.similar_movies[0], null, 2));
        setSimilarMovies(movieData.similar_movies);
      } else {
        console.log('No similar movies found in response, trying recommendations...');
        // Fallback to recommendations if no similar movies
        try {
          const recs = await getMovieRecommendations(movieId);
          console.log('Fetched recommendations count:', recs.length);
          if (recs.length > 0) {
            console.log('Sample recommendation:', JSON.stringify(recs[0], null, 2));
          }
          setRecommendations(recs);
        } catch (recError) {
          console.error('Error fetching recommendations:', recError);
          setRecommendations([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch movie details:', err);
      setError('Failed to load movie details. Please check your internet connection and try again.');
    } finally {
      console.log('Finished loading movie data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieData();
  }, [movieId]);

  const handleRetry = () => {
    setError('');
    fetchMovieData();
  };

  const handleMoviePress = (movieId: number) => {
    navigation.push('MovieDetail', { movieId });
  };

  const handleBackPress = () => {
    setShowBackdrop(true);
    // Navigate back after a short delay to show the backdrop
    setTimeout(() => {
      navigation.goBack();
    }, 100);
  };

  const renderCastMember = (member: Cast, index: number) => (
    <View key={`${member.id}-${index}`} style={styles.castMember}>
      <View style={styles.castPhoto}>
        {member.profile_path ? (
          <Image 
            source={{ uri: `https://image.tmdb.org/t/p/w200${member.profile_path}` }} 
            style={styles.castImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.castPlaceholder}>
            <Ionicons name="person" size={40} color="#666" />
          </View>
        )}
      </View>
      <Text style={styles.castName} numberOfLines={1}>{member.name}</Text>
      <Text style={styles.castRole} numberOfLines={1}>{member.character}</Text>
    </View>
  );

  const toggleVideo = () => {
    setVideoVisible(!videoVisible);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6a11cb" />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.centered}>
        <Ionicons name="sad-outline" size={48} color="#6a11cb" style={styles.errorIcon} />
        <Text style={styles.errorText}>
          {error || 'Failed to load movie details'}
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.retryButton]}
            onPress={handleRetry}
          >
            <Ionicons name="refresh" size={18} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.backButton]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color="#6a11cb" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Backdrop with Gradient Overlay - Only shown when showBackdrop is true */}
        {showBackdrop && (
          <View style={styles.backdropContainer}>
            <Image
              source={{ uri: movie.backdrop_path ? 
                `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : 
                'https://via.placeholder.com/800x450?text=No+Backdrop' 
              }}
              style={styles.backdrop}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
              style={styles.gradient}
            />
          </View>
        )}
        
        {/* Back button - Always visible */}
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        
        {/* Add spacer when backdrop is hidden to maintain consistent layout */}
        {!showBackdrop && <View style={styles.spacer} />}

        {/* Main Content */}
        <View style={styles.content}>
          {/* Movie Poster and Info */}
          <View style={styles.movieHeader}>
            <Image
              source={{ 
                uri: movie.poster_path ? 
                  `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 
                  'https://via.placeholder.com/200x300?text=No+Poster' 
              }}
              style={styles.poster}
              resizeMode="cover"
            />
            
            <View style={styles.movieInfo}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{movie.title}</Text>
                <Text style={styles.releaseYear}>
                  ({new Date(movie.release_date).getFullYear()})
                </Text>
              </View>
              
              <View style={styles.metaContainer}>
                <View style={styles.ratingContainer}>
                  <FontAwesome name="star" size={16} color="#FFD700" />
                  <Text style={styles.rating}>
                    {movie.vote_average?.toFixed(1)}/10
                  </Text>
                </View>
                
                {Array.isArray(movie.genres) && movie.genres.length > 0 && (
                  <Text style={styles.genre}>
                    {movie.genres.map(g => typeof g === 'string' ? g : g.name).join(' • ')}
                  </Text>
                )}
                
                {movie.runtime && (
                  <View style={styles.duration}>
                    <FontAwesome5 name="clock" size={14} color="#bbb" />
                    <Text style={styles.durationText}>
                      {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={toggleVideo}
                >
                  <Ionicons name="play" size={20} color="#000" />
                  <Text style={styles.playButtonText}>Watch Now</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="heart-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Overview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.overview}>
              {movie.overview || 'No overview available.'}
            </Text>
          </View>
          
          {/* Cast Section */}
          {cast.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cast</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castContainer}
              >
                {cast.slice(0, 10).map((member, index) => renderCastMember(member, index))}
              </ScrollView>
            </View>
          )}
          
          {/* Similar Movies Section */}
          {(similarMovies.length > 0 || recommendations.length > 0) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>More Like This</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.movieListContainer}>
                <MovieList
                  movies={similarMovies.length > 0 ? similarMovies : recommendations}
                  onMoviePress={handleMoviePress}
                  horizontal
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Video Player Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={videoVisible}
        onRequestClose={toggleVideo}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={toggleVideo} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.videoContainer}>
            {movie.video_url ? (
              <Text style={styles.comingSoonText}>Video player would be embedded here</Text>
            ) : (
              <Text style={styles.comingSoonText}>Video not available</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#141414',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#141414',
  },
  backdropContainer: {
    height: 150, // Adjusted height
    position: 'relative',
    overflow: 'hidden',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20, // Increased zIndex to ensure it's above other elements
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  // Add a spacer to maintain consistent height when backdrop is hidden
  spacer: {
    height: 20, // Matches the marginTop of the content
  },
  content: {
    padding: 16,
    paddingTop: 0, // Remove top padding since we'll control it with marginTop
    marginTop: 20, // Consistent top margin regardless of backdrop visibility
    backgroundColor: '#141414',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 0,
  },
  movieHeader: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start', // Align items to the top
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
    marginTop: 0, // Ensure poster is aligned to the top
  },
  movieInfo: {
    flex: 1,
    justifyContent: 'flex-start', // Align content to the top
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8, // Add some space below the title
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
    marginTop: 0,
    marginBottom: 4,
  },
  releaseYear: {
    fontSize: 18,
    color: '#999',
    marginTop: 0,
    marginBottom: 4,
  },
  metaContainer: {
    marginVertical: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12, // Add more space before action buttons
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rating: {
    color: '#FFD700',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  genre: {
    color: '#fff',
    fontSize: 14,
    marginRight: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#bbb',
    fontSize: 14,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
    gap: 12, // Add consistent gap between buttons
  },
  playButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  playButtonText: {
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAll: {
    color: '#00BFFF',
    fontSize: 14,
  },
  overview: {
    color: '#ddd',
    fontSize: 15,
    lineHeight: 22,
  },
  castContainer: {
    paddingRight: 16,
  },
  castMember: {
    width: 80,
    marginRight: 16,
  },
  castPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    overflow: 'hidden',
    marginBottom: 8,
  },
  castImage: {
    width: '100%',
    height: '100%',
  },
  castPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#444',
  },
  castName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  castRole: {
    color: '#999',
    fontSize: 11,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 16,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 30,
    fontSize: 16,
    lineHeight: 22,
  },
  errorIcon: {
    marginBottom: 16,
  },
  movieList: {
    marginTop: 10,
  },
  movieListContainer: {
    marginTop: 10,
    height: 250, // Fixed height for the movie list
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    marginHorizontal: 8,
    minWidth: 120,
  },
  retryButton: {
    backgroundColor: '#6a11cb',
  },
  backButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6a11cb',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#00BFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 6,
  },
});

export default MovieDetailScreen;