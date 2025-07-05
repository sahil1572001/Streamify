import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import GenreMoviesScreen from '../screens/GenreMoviesScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Search: { query?: string };
  MovieDetail: { movieId: number };
  GenreMovies: { genre: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen} 
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="MovieDetail" 
        component={MovieDetailScreen} 
        options={{ title: 'Movie Details' }}
      />
      <Stack.Screen 
        name="GenreMovies" 
        component={GenreMoviesScreen} 
        options={{
          headerShown: false
        }}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;