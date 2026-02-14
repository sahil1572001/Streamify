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
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { authService } from '../../services/authService';
import { API_CONFIG } from '../../config/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.max((width - 48) / 2, 140); // 2 columns with padding, min 140px

interface VisionBoardItem {
  id: number;
  movie_id: number;
  position: number;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  movie?: {
    id: number;
    title: string;
    poster_url: string;
    backdrop_url: string;
    rating: number;
    genres: string[];
    release_year: number;
  };
}

interface WatchlistMovie {
  id: number;
  movie_id: number;
  movie?: {
    id: number;
    title: string;
    poster_url: string;
    rating: number;
    genres: string[];
    release_year: number;
  };
}

export default function VisionBoardScreen() {
  const router = useRouter();
  const [visionBoard, setVisionBoard] = useState<VisionBoardItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<VisionBoardItem | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchVisionBoard(), fetchWatchlist()]);
    setLoading(false);
  };

  const fetchVisionBoard = async () => {
    try {
      const token = await authService.getToken();
      if (!token) return;

      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/vision-board/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setVisionBoard(response.data.sort((a: VisionBoardItem, b: VisionBoardItem) => a.position - b.position));
    } catch (error) {
      console.error('Error fetching vision board:', error);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const token = await authService.getToken();
      if (!token) return;

      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/watchlist/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter out movies already in vision board
      const visionBoardMovieIds = visionBoard.map(item => item.movie_id);
      const availableMovies = response.data.filter(
        (item: WatchlistMovie) => !visionBoardMovieIds.includes(item.movie_id)
      );
      
      setWatchlist(availableMovies);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  };

  const handleAddToVisionBoard = async () => {
    if (!selectedMovie) return;

    try {
      const token = await authService.getToken();
      if (!token) return;

      await axios.post(
        `${API_CONFIG.BASE_URL}/api/vision-board/`,
        {
          movie_id: selectedMovie.movie_id,
          priority: priority,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowAddModal(false);
      setSelectedMovie(null);
      setPriority('medium');
      await fetchData();
      Alert.alert('Success', 'Added to Vision Board! 🎬');
    } catch (error: any) {
      console.error('Error adding to vision board:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add to Vision Board');
    }
  };

  const handleRemove = async (itemId: number) => {
    try {
      const token = await authService.getToken();
      if (!token) return;

      await axios.delete(`${API_CONFIG.BASE_URL}/api/vision-board/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchData();
    } catch (error) {
      console.error('Error removing from vision board:', error);
      Alert.alert('Error', 'Failed to remove from vision board');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFD93D';
      case 'low': return '#6BCF7F';
      default: return '#888';
    }
  };

  const renderVisionBoardCard = ({ item, index }: { item: VisionBoardItem; index: number }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/movie/${item.movie?.id}` as any)}
      activeOpacity={0.9}
    >
      {/* Card Frame - Inspired by reference */}
      <LinearGradient
        colors={['rgba(138, 43, 226, 0.3)', 'rgba(75, 0, 130, 0.5)']}
        style={styles.cardFrame}
      >
        {/* Position Badge */}
        <View style={[styles.positionBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.positionText}>#{index + 1}</Text>
        </View>

        {/* Movie Poster */}
        <View style={styles.posterContainer}>
          <Image
            source={{ uri: item.movie?.poster_url }}
            style={styles.poster}
            resizeMode="cover"
          />
          
          {/* Glow Effect */}
          <View style={[styles.glowEffect, { backgroundColor: getPriorityColor(item.priority) }]} />
        </View>

        {/* Movie Title & Info */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.95)']}
          style={styles.titleGradient}
        >
          <Text style={styles.movieTitle} numberOfLines={1}>
            {item.movie?.title}
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.metadata}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.rating}>{item.movie?.rating?.toFixed(1)}</Text>
            </View>
            {item.notes && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedNotes(item);
                  setShowNotesModal(true);
                }}
                style={styles.notesIcon}
              >
                <Ionicons name="document-text" size={12} color="#8B5CF6" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={(e) => {
            e.stopPropagation();
            handleRemove(item.id);
          }}
        >
          <Ionicons name="close-circle" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderWatchlistItem = ({ item }: { item: WatchlistMovie }) => (
    <TouchableOpacity
      style={styles.watchlistItem}
      onPress={() => setSelectedMovie(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.movie?.poster_url }}
        style={styles.watchlistPoster}
        resizeMode="cover"
      />
      <View style={styles.watchlistInfo}>
        <Text style={styles.watchlistTitle} numberOfLines={2}>
          {item.movie?.title}
        </Text>
        <View style={styles.watchlistMeta}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.watchlistRating}>{item.movie?.rating?.toFixed(1)}</Text>
        </View>
      </View>
      {selectedMovie?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#6BCF7F" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading your vision board...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with cosmic theme */}
      <LinearGradient
        colors={['#1a0033', '#000']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>WHO I AM</Text>
            <Text style={styles.headerSubtitle}>MY VISION BOARD</Text>
            <Text style={styles.movieCount}>
              {visionBoard.length} {visionBoard.length === 1 ? 'movie' : 'movies'} planned
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (watchlist.length === 0) {
                Alert.alert(
                  'No Movies Available',
                  'Add movies to your Watchlist first, then you can plan them here!',
                  [{ text: 'Go to Watchlist', onPress: () => router.push('/(tabs)/watchlist' as any) }]
                );
              } else {
                setShowAddModal(true);
              }
            }}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Priority Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>Must Watch</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFD93D' }]} />
            <Text style={styles.legendText}>Soon</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6BCF7F' }]} />
            <Text style={styles.legendText}>Someday</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Vision Board Grid */}
      {visionBoard.length > 0 ? (
        <FlatList
          data={visionBoard}
          renderItem={renderVisionBoardCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['rgba(138, 43, 226, 0.2)', 'rgba(75, 0, 130, 0.3)']}
            style={styles.emptyCard}
          >
            <Ionicons name="film-outline" size={64} color="#8B5CF6" />
            <Text style={styles.emptyTitle}>Your Vision Board Awaits</Text>
            <Text style={styles.emptyText}>
              Add movies from your Watchlist{'\n'}to plan your perfect movie marathon
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)/watchlist' as any)}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={styles.exploreBtnGradient}
              >
                <Ionicons name="bookmark" size={20} color="#fff" />
                <Text style={styles.exploreBtnText}>Go to Watchlist</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Add from Watchlist Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add from Watchlist</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select a movie from your watchlist
            </Text>

            {/* Watchlist Selection */}
            <ScrollView style={styles.watchlistScroll}>
              {watchlist.map((item) => (
                <View key={item.id}>
                  {renderWatchlistItem({ item })}
                </View>
              ))}
            </ScrollView>

            {/* Priority Selection */}
            {selectedMovie && (
              <>
                <Text style={styles.priorityTitle}>Set Priority</Text>
                <View style={styles.priorityButtons}>
                  <TouchableOpacity
                    style={[styles.priorityBtn, priority === 'high' && styles.priorityBtnActive]}
                    onPress={() => setPriority('high')}
                  >
                    <LinearGradient
                      colors={priority === 'high' ? ['#FF6B6B', '#EE5A6F'] : ['#333', '#222']}
                      style={styles.priorityBtnGradient}
                    >
                      <Ionicons name="flame" size={20} color="#fff" />
                      <Text style={styles.priorityBtnText}>Must Watch</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.priorityBtn, priority === 'medium' && styles.priorityBtnActive]}
                    onPress={() => setPriority('medium')}
                  >
                    <LinearGradient
                      colors={priority === 'medium' ? ['#FFD93D', '#F6C744'] : ['#333', '#222']}
                      style={styles.priorityBtnGradient}
                    >
                      <Ionicons name="star" size={20} color="#fff" />
                      <Text style={styles.priorityBtnText}>Soon</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.priorityBtn, priority === 'low' && styles.priorityBtnActive]}
                    onPress={() => setPriority('low')}
                  >
                    <LinearGradient
                      colors={priority === 'low' ? ['#6BCF7F', '#51B96B'] : ['#333', '#222']}
                      style={styles.priorityBtnGradient}
                    >
                      <Ionicons name="time" size={20} color="#fff" />
                      <Text style={styles.priorityBtnText}>Someday</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Add Button */}
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleAddToVisionBoard}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#6D28D9']}
                    style={styles.confirmBtnGradient}
                  >
                    <Ionicons name="add-circle" size={24} color="#fff" />
                    <Text style={styles.confirmBtnText}>Add to Vision Board</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <TouchableOpacity
          style={styles.notesModalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotesModal(false)}
        >
          <View style={styles.notesModalContent}>
            <LinearGradient
              colors={['#1a0033', '#2d1b4e']}
              style={styles.notesCard}
            >
              <View style={styles.notesHeader}>
                <Ionicons name="document-text" size={24} color="#8B5CF6" />
                <Text style={styles.notesMovieTitle}>{selectedNotes?.movie?.title}</Text>
              </View>
              <Text style={styles.notesText}>{selectedNotes?.notes}</Text>
              <TouchableOpacity
                style={styles.closeNotesBtn}
                onPress={() => setShowNotesModal(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>
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
    gap: 16,
  },
  loadingText: {
    color: '#8B5CF6',
    fontSize: 16,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  movieCount: {
    fontSize: 14,
    color: '#888',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#888',
    fontSize: 11,
  },
  grid: {
    padding: 15,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  cardFrame: {
    borderRadius: 12,
    padding: 3,
    position: 'relative',
  },
  positionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 3,
  },
  positionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  posterContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
    backgroundColor: '#1a1a1a',
  },
  glowEffect: {
    position: 'absolute',
    bottom: -20,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 40,
    opacity: 0.3,
    borderRadius: 30,
  },
  titleGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    paddingTop: 24,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  notesIcon: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    padding: 4,
    borderRadius: 4,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 2,
    zIndex: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 400,
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  exploreBtn: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  exploreBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  watchlistScroll: {
    maxHeight: 200,
    marginBottom: 20,
  },
  watchlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  watchlistPoster: {
    width: 50,
    height: 75,
    borderRadius: 8,
  },
  watchlistInfo: {
    flex: 1,
  },
  watchlistTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  watchlistMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  watchlistRating: {
    color: '#888',
    fontSize: 12,
  },
  priorityTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  priorityBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  priorityBtnActive: {
    transform: [{ scale: 1.05 }],
  },
  priorityBtnGradient: {
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  priorityBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  confirmBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notesModalContent: {
    width: '100%',
    maxWidth: 400,
  },
  notesCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  notesMovieTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notesText: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  closeNotesBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
