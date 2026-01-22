import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        // User is already signed in, go to home
        router.replace('/(tabs)' as any);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200' }}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo/Brand */}
          <View style={styles.logoContainer}>
            <Ionicons name="film" size={80} color="#fff" />
            <Text style={styles.logoText}>Streamify</Text>
            <Text style={styles.tagline}>AI-Powered Movie Discovery</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Ionicons name="search" size={24} color="#667eea" />
              <Text style={styles.featureText}>Smart Search</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="sparkles" size={24} color="#667eea" />
              <Text style={styles.featureText}>AI Recommendations</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="bookmark" size={24} color="#667eea" />
              <Text style={styles.featureText}>Personal Watchlist</Text>
            </View>
          </View>

          {/* CTA Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/auth/signin' as any)}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push('/auth/signup' as any)}
            >
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Discover your next favorite movie with AI
          </Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 8,
    letterSpacing: 1,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 500,
  },
  feature: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  signInButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  signUpButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
