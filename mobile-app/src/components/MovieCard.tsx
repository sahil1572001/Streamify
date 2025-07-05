import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ImageSourcePropType, ViewStyle, StyleProp } from 'react-native';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'featured' | 'default';
}

const MovieCard: React.FC<MovieCardProps> = ({ 
  movie, 
  onPress, 
  style,
  variant = 'default'
}) => {
  // Debug log the movie data
  React.useEffect(() => {
    console.log('Rendering MovieCard:', {
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      poster_url: movie.poster_url,
      hasPoster: !!(movie.poster_path || movie.poster_url)
    });
  }, [movie]);

  const renderContent = () => {
    // Handle missing poster with a placeholder
    const posterSource = movie.poster_path || movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Poster';
    
    // Handle release year from either release_date or release_year
    const releaseYear = movie.release_date 
      ? (movie.release_date.split('-')[0] || 'N/A')
      : (movie.release_year ? movie.release_year.toString() : 'N/A');
    
    return (
      <View style={[styles.card, style]}>
        <View style={styles.posterContainer}>
          <Image 
            source={{ uri: posterSource }} 
            style={styles.poster} 
            resizeMode="cover"
            onError={(e) => console.log('Image load error:', e.nativeEvent.error, 'for movie:', movie.id, movie.title)}
          />
          <View style={styles.overlay}>
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
        </View>
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>
            {movie.title || 'Untitled Movie'}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.year}>
              {releaseYear}
            </Text>
            {movie.vote_average !== undefined && (
              <Text style={styles.rating}>
                <Text style={styles.starIcon}>★</Text> {movie.vote_average.toFixed(1)}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  posterContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  playIcon: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 3,
  },
  details: {
    padding: 8,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  year: {
    color: '#999',
    fontSize: 12,
  },
  rating: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '600',
  },
  starIcon: {
    color: '#ffd700',
  },
});

export default MovieCard;