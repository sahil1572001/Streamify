import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
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

interface WatchlistItem {
  id: number;
  movie_id: number;
  watched: boolean;
  watch_progress: number;
}

interface Movie {
  id: number;
  title: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  rating: number;
  genres: string[];
  duration: number;
}

export default function WatchlistScreen() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const token = await authService.getToken();
      if (!token) {
        console.log('❌ No token found - user may not be authenticated');
        Alert.alert('Authentication Required', 'Please sign in again');
        setLoading(false);
        return;
      }

      console.log('📡 Fetching watchlist from API...');
      console.log('Token:', token.substring(0, 20) + '...');
      
      const response = await axios.get(`${API_URL}/api/watchlist/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Watchlist response:', response.data);
      setWatchlist(response.data);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching watchlist:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        
        // If 401, token is invalid
        if (error.response?.status === 401) {
          console.log('🔐 Token invalid - clearing and prompting re-login');
          await authService.removeToken();
          Alert.alert('Session Expired', 'Please sign in again');
        }
      }
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (watchlistItemId: number) => {
    try {
      const token = await authService.getToken();
      if (!token) return;

      await axios.delete(`${API_URL}/api/watchlist/${watchlistItemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh watchlist
      fetchWatchlist();
      Alert.alert('Success', 'Removed from watchlist');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      Alert.alert('Error', 'Failed to remove from watchlist');
    }
  };

  const handleMoviePress = (movieId: number) => {
    router.push(`/movie/${movieId}` as any);
  };

  const renderWatchlistItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.movieCard}
      onPress={() => handleMoviePress(item.movie?.id || item.movie_id)}
    >
      <Image
        source={{ uri: item.movie?.poster_url || item.poster_url }}
        style={styles.moviePoster}
        resizeMode="cover"
      />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={1}>
          {item.movie?.title || item.title}
        </Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${item.watch_progress || 0}%` },
              ]}
            />
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={(e) => {
          e.stopPropagation();
          handleRemoveFromWatchlist(item.id);
        }}
      >
        <Ionicons name="close-circle" size={24} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>My Watchlist</Text>
            <Text style={styles.headerSubtitle}>
              {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'}
            </Text>
          </View>
          <TouchableOpacity onPress={fetchWatchlist} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {watchlist.length > 0 ? (
        <FlatList
          data={watchlist}
          renderItem={renderWatchlistItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.movieList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#444" />
          <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
          <Text style={styles.emptyText}>
            Add movies to your watchlist to watch them later
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
  },
  refreshButton: {
    padding: 8,
  },
  movieList: {
    padding: 20,
    paddingTop: 0,
  },
  movieCard: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  moviePoster: {
    width: 100,
    height: 150,
  },
  movieInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});
