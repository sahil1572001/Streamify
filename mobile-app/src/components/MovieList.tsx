import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ListRenderItem } from 'react-native';
import { Movie } from '../types';
import MovieCard from './MovieCard';

interface MovieListProps {
  movies: Movie[];
  onMoviePress: (movieId: number) => void;
  horizontal?: boolean;
  emptyMessage?: string;
  numColumns?: number;
}

const MovieList: React.FC<MovieListProps> = ({
  movies,
  onMoviePress,
  horizontal = false,
  emptyMessage = 'No movies found',
  numColumns = 1,
}) => {
  // Debug: Log the movies being passed to the component
  React.useEffect(() => {
    console.log('MovieList received movies:', {
      count: movies.length,
      movies: movies.map(m => ({
        id: m.id,
        title: m.title,
        poster_path: m.poster_path || m.poster_url,
        hasPoster: !!(m.poster_path || m.poster_url)
      }))
    });
  }, [movies]);
  const renderMovieCard: ListRenderItem<Movie> = ({ item }) => (
    <TouchableOpacity 
      onPress={() => onMoviePress(item.id)}
      activeOpacity={0.7}
      style={styles.movieCardWrapper}
    >
      <MovieCard movie={item} />
    </TouchableOpacity>
  );

  if (movies.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  // Add debug logging for rendering
  console.log(`Rendering MovieList with ${movies.length} movies, horizontal=${horizontal}`);

  // If no movies, show empty message
  if (movies.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={movies}
        renderItem={renderMovieCard}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal={horizontal}
        numColumns={horizontal ? undefined : numColumns}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          horizontal ? styles.horizontalList : {},
          !horizontal && numColumns > 1 ? styles.gridList : {}
        ]}
        columnWrapperStyle={!horizontal && numColumns > 1 ? styles.columnWrapper : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        }
      />
    </View>
  );
};

export default MovieList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  horizontalList: {
    paddingLeft: 8,
  },
  gridList: {
    justifyContent: 'space-between',
  },
  movieCardWrapper: {
    margin: 8,
    width: 120, // Fixed width for horizontal scrolling
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
