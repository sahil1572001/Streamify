import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Movie {
  id: number;
  title: string;
  description?: string;
  poster_url: string;
  backdrop_url?: string;
  rating: number;
  genres: string[];
  release_year: number;
  duration?: number;
  content_type?: string;
}

interface MovieCardProps {
  movie: Movie;
  onPress?: () => void;
  onWatchlistPress?: (movieId: number) => void;
  cardWidth?: number;
  cardHeight?: number;
  isInWatchlist?: boolean;
}

export default function MovieCard({ 
  movie, 
  onPress, 
  onWatchlistPress,
  cardWidth: customWidth,
  cardHeight: customHeight,
  isInWatchlist = false,
}: MovieCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [watchlistAdded, setWatchlistAdded] = useState(isInWatchlist);
  
  // Responsive sizing if not provided
  const isMobile = windowWidth < 768;
  const defaultWidth = isMobile ? Math.max(windowWidth * 0.38, 120) : 180;
  const cardWidth = customWidth || defaultWidth;
  const cardHeight = customHeight || cardWidth * 1.5;

  const handleWatchlistPress = () => {
    setWatchlistAdded(!watchlistAdded);
    onWatchlistPress?.(movie.id);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth, height: cardHeight }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Movie Poster */}
      <Image
        source={{ uri: movie.poster_url }}
        style={styles.poster}
        resizeMode="cover"
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      >
        {/* Movie Info */}
        <View style={styles.info}>
          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {movie.title}
          </Text>

          {/* Year and Type */}
          <View style={styles.metadata}>
            <Text style={styles.year}>{movie.release_year}</Text>
            {movie.content_type && (
              <>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.type}>
                  {movie.content_type === 'tv' ? 'TV Series' : 'Movie'}
                </Text>
              </>
            )}
          </View>

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <View style={styles.genresContainer}>
              {movie.genres.slice(0, 2).map((genre, index) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.rating}>{movie.rating.toFixed(1)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Featured Badge */}
      {movie.rating >= 8.0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⭐ Featured</Text>
        </View>
      )}

      {/* Watchlist Button */}
      {onWatchlistPress && (
        <TouchableOpacity
          style={styles.watchlistButton}
          onPress={handleWatchlistPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={watchlistAdded ? 'checkmark-circle' : 'add-circle'}
            size={28}
            color={watchlistAdded ? '#4CAF50' : '#fff'}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  info: {
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  year: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '500',
  },
  dot: {
    fontSize: 12,
    color: '#666',
  },
  type: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '500',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  genreTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  genreText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  star: {
    fontSize: 14,
    color: '#FFD700',
    marginRight: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  watchlistButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 4,
  },
});
