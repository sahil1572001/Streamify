import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { searchMovies } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'GenreMovies'>;

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - CARD_MARGIN * 4) / 2;

const GenreMoviesScreen = ({ route, navigation }: Props) => {
  const { genre } = route.params;
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMoviesByGenre = async () => {
      try {
        setLoading(true);
        const results = await searchMovies(genre);
        setMovies(results);
        if (results.length === 0) {
          setError(`No ${genre} movies found.`);
        }
      } catch (err) {
        console.error('Error fetching genre movies:', err);
        setError('Failed to load movies. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMoviesByGenre();
  }, [genre]);

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
      style={styles.movieCardContainer}
    >
      <MovieCard movie={item} variant="default" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={50} color="#E50914" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.genreTitle}>{genre} Movies</Text>
      </View>
      
      <FlatList
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.movieList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  genreTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  movieList: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  movieCardContainer: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
  },
});

export default GenreMoviesScreen;
