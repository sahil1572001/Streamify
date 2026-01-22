# 🔧 Frontend Critical Fixes - Implementation Guide

## Quick Start - Apply All Fixes

### Step 1: Install Required Dependencies
```bash
cd streamify-frontend
npx expo install expo-secure-store expo-constants @react-native-community/netinfo
```

### Step 2: Update Configuration Files

**File: `app.json`**
Add environment configuration:
```json
{
  "expo": {
    "name": "Streamify",
    "slug": "streamify",
    "version": "1.0.0",
    "extra": {
      "apiUrl": "http://localhost:8080",
      "environment": "development"
    }
  }
}
```

For production, use:
```json
"extra": {
  "apiUrl": "https://api.yourdomain.com",
  "environment": "production"
}
```

---

## Priority 0 Fixes (Critical - Implement Immediately)

### Fix 1: Secure Token Storage

**File: `services/authService.ts`**

Replace entire file with:
```typescript
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

// Use SecureStore for sensitive data, AsyncStorage for non-sensitive
const isSecureStoreAvailable = async (): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync('test', 'test');
    await SecureStore.deleteItemAsync('test');
    return true;
  } catch {
    return false;
  }
};

export const authService = {
  // Store auth token securely
  async setToken(token: string): Promise<void> {
    try {
      const useSecure = await isSecureStoreAvailable();
      if (useSecure) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  },

  // Get auth token
  async getToken(): Promise<string | null> {
    try {
      const useSecure = await isSecureStoreAvailable();
      if (useSecure) {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      } else {
        return await AsyncStorage.getItem(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Remove auth token
  async removeToken(): Promise<void> {
    try {
      const useSecure = await isSecureStoreAvailable();
      if (useSecure) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // Store user data (non-sensitive)
  async setUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  },

  // Get user data
  async getUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Remove user data
  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },

  // Logout (clear all auth data)
  async logout(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  },

  // Get authorization header
  async getAuthHeader(): Promise<{ Authorization: string } | {}> {
    const token = await this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
```

---

### Fix 2: Environment-Based API Configuration

**Create: `config/environment.ts`**
```typescript
import Constants from 'expo-constants';

interface Environment {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  enableLogging: boolean;
}

const getEnvironment = (): Environment => {
  const extra = Constants.expoConfig?.extra;
  
  return {
    apiUrl: extra?.apiUrl || 'http://localhost:8080',
    environment: extra?.environment || 'development',
    enableLogging: extra?.environment !== 'production',
  };
};

export const ENV = getEnvironment();

export default ENV;
```

**Create: `config/axios.ts`**
```typescript
import axios, { AxiosError } from 'axios';
import { authService } from '../services/authService';
import { ENV } from './environment';
import { logger } from '../utils/logger';

const apiClient = axios.create({
  baseURL: ENV.apiUrl,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    logger.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    logger.debug(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    logger.error('API Error:', error.response?.status, error.message);
    
    // Handle 401 - token expired
    if (error.response?.status === 401) {
      await authService.logout();
      // You can emit an event here to redirect to login
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### Fix 3: Logging Utility

**Create: `utils/logger.ts`**
```typescript
import { ENV } from '../config/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!ENV.enableLogging && level === 'debug') {
      return false;
    }
    return true;
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log('[INFO]', ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
  }
}

export const logger = new Logger();
```

---

### Fix 4: Input Validation Utilities

**Create: `utils/validation.ts`**
```typescript
export const validation = {
  email: (email: string): { valid: boolean; message?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { valid: false, message: 'Email is required' };
    }
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    return { valid: true };
  },

  password: (password: string): { valid: boolean; message?: string } => {
    if (!password) {
      return { valid: false, message: 'Password is required' };
    }
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain an uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain a lowercase letter' };
    }
    if (!/\d/.test(password)) {
      return { valid: false, message: 'Password must contain a number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain a special character' };
    }
    return { valid: true };
  },

  required: (value: any, fieldName: string): { valid: boolean; message?: string } => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { valid: false, message: `${fieldName} is required` };
    }
    return { valid: true };
  },
};
```

---

### Fix 5: Error Handler Utility

**Create: `utils/errorHandler.ts`**
```typescript
import { Alert } from 'react-native';
import { AxiosError } from 'axios';
import { logger } from './logger';

export const handleApiError = (error: any, customMessage?: string): void => {
  logger.error('API Error:', error);

  let message = customMessage || 'An error occurred';

  if (error.response) {
    // Server responded with error
    const status = error.response.status;
    const data = error.response.data;

    message = data?.detail || data?.message || message;

    if (status === 401) {
      message = 'Session expired. Please sign in again.';
    } else if (status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (status === 404) {
      message = 'Resource not found.';
    } else if (status === 422) {
      message = 'Invalid input. Please check your data.';
    } else if (status >= 500) {
      message = 'Server error. Please try again later.';
    }
  } else if (error.request) {
    // Request made but no response
    message = 'Network error. Please check your internet connection.';
  } else if (error.message) {
    message = error.message;
  }

  Alert.alert('Error', message);
};
```

---

### Fix 6: Error Boundary Component

**Create: `components/ErrorBoundary.tsx`**
```typescript
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // TODO: Log to error tracking service (Sentry, etc.)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff4444" />
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

### Fix 7: Network Status Hook

**Create: `hooks/useNetworkStatus.ts`**
```typescript
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, isInternetReachable };
};
```

---

## Update Existing Files

### Update: `app/_layout.tsx`

Wrap with ErrorBoundary:
```typescript
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  // ... existing code ...

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/signin" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="movie/[id]" />
      </Stack>
    </ErrorBoundary>
  );
}
```

---

### Update: `app/auth/signin.tsx`

Replace API calls and add validation:
```typescript
import apiClient from '../../config/axios';
import { validation } from '../../utils/validation';
import { handleApiError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

const handleSignIn = async () => {
  // Validate email
  const emailCheck = validation.email(email);
  if (!emailCheck.valid) {
    Alert.alert('Error', emailCheck.message);
    return;
  }

  // Validate password
  const passwordCheck = validation.required(password, 'Password');
  if (!passwordCheck.valid) {
    Alert.alert('Error', passwordCheck.message);
    return;
  }

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await apiClient.post('/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const { access_token } = response.data;
    logger.info('Login successful');
    
    await authService.setToken(access_token);
    
    // Fetch user data
    try {
      const userResponse = await apiClient.get('/api/users/me');
      await authService.setUser(userResponse.data);
      logger.info('User data stored');
    } catch (err) {
      logger.error('Error fetching user data:', err);
    }
    
    router.replace('/(tabs)');
  } catch (error) {
    handleApiError(error, 'Invalid email or password');
  } finally {
    setLoading(false);
  }
};
```

---

### Update: `app/(tabs)/index.tsx`

Replace hardcoded API_URL and add network check:
```typescript
import apiClient from '../../config/axios';
import { handleApiError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function HomeScreen() {
  const { isConnected } = useNetworkStatus();
  // ... existing state ...

  useEffect(() => {
    if (isConnected === false) {
      Alert.alert('No Internet', 'Please check your connection');
    }
  }, [isConnected]);

  const fetchMovies = async () => {
    try {
      const [featured, trending, topRated, action, comedy, horror, animation] = await Promise.all([
        apiClient.get('/api/movies/featured'),
        apiClient.get('/api/movies/trending'),
        apiClient.get('/api/movies/top-rated'),
        apiClient.get('/api/movies/by-genre?genre=Action&limit=20'),
        apiClient.get('/api/movies/by-genre?genre=Comedy&limit=20'),
        apiClient.get('/api/movies/by-genre?genre=Horror&limit=20'),
        apiClient.get('/api/movies/by-genre?genre=Animation&limit=20'),
      ]);

      setFeaturedMovies(featured.data);
      setTrendingMovies(trending.data);
      setTopRatedMovies(topRated.data);
      setActionMovies(action.data);
      setComedyMovies(comedy.data);
      setHorrorMovies(horror.data);
      setAnimationMovies(animation.data);
      
      if (featured.data.length > 0) {
        setHeroMovie(featured.data[0]);
      }
      
      fetchRecommendations();
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching movies:', error);
      handleApiError(error, 'Failed to load movies');
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = await authService.getToken();
      if (!token) {
        logger.debug('No token - skipping recommendations');
        return;
      }
      
      logger.debug('Fetching personalized recommendations');
      const response = await apiClient.post('/api/search/recommendations', { top_k: 20 });
      
      if (response.data && response.data.length > 0) {
        setRecommendedMovies(response.data);
        logger.info(`Loaded ${response.data.length} recommendations`);
      }
    } catch (error) {
      logger.debug('Recommendations not available:', error);
      setRecommendedMovies([]);
    }
  };

  const handleWatchlistPress = async (movieId: number) => {
    try {
      const token = await authService.getToken();
      if (!token) {
        Alert.alert('Sign In Required', 'Please sign in to add to watchlist');
        return;
      }
      
      logger.debug(`Adding movie ${movieId} to watchlist`);
      await apiClient.post('/api/watchlist/', { movie_id: movieId });
      
      await fetchRecommendations();
      Alert.alert('Success', 'Added to watchlist! Recommendations updated.');
    } catch (error) {
      handleApiError(error, 'Failed to add to watchlist');
    }
  };
  
  // ... rest of component
}
```

---

## Testing After Implementation

### 1. Test Secure Storage
```typescript
// In any component
const testSecureStorage = async () => {
  await authService.setToken('test_token_123');
  const token = await authService.getToken();
  console.log('Token retrieved:', token);
  await authService.removeToken();
};
```

### 2. Test Environment Config
```typescript
import { ENV } from './config/environment';
console.log('API URL:', ENV.apiUrl);
console.log('Environment:', ENV.environment);
```

### 3. Test Network Detection
```typescript
const { isConnected } = useNetworkStatus();
console.log('Network status:', isConnected);
```

### 4. Test Error Boundary
```typescript
// Throw an error to test
throw new Error('Test error boundary');
```

---

## Deployment Checklist

### Development
```json
// app.json
"extra": {
  "apiUrl": "http://localhost:8080",
  "environment": "development"
}
```

### Production
```json
// app.json
"extra": {
  "apiUrl": "https://api.yourdomain.com",
  "environment": "production"
}
```

### Build Commands
```bash
# Development build
eas build --profile development

# Production build
eas build --profile production
```

---

## Summary of Changes

### Files Created (7)
1. `config/environment.ts` - Environment configuration
2. `config/axios.ts` - Axios instance with interceptors
3. `utils/logger.ts` - Logging utility
4. `utils/validation.ts` - Input validation
5. `utils/errorHandler.ts` - Error handling
6. `components/ErrorBoundary.tsx` - Error boundary
7. `hooks/useNetworkStatus.ts` - Network detection

### Files Modified (5)
1. `services/authService.ts` - Secure storage
2. `app/_layout.tsx` - Error boundary wrapper
3. `app/auth/signin.tsx` - Validation & API client
4. `app/auth/signup.tsx` - Validation & API client
5. `app/(tabs)/index.tsx` - API client & error handling

### Dependencies Added
```bash
expo-secure-store
expo-constants
@react-native-community/netinfo
```

---

## Estimated Implementation Time

- **Setup & Dependencies:** 30 minutes
- **Create Utilities:** 1-2 hours
- **Update Existing Files:** 2-3 hours
- **Testing:** 1-2 hours
- **Total:** 4-7 hours

---

**Status:** Ready to implement  
**Priority:** CRITICAL  
**Next Steps:** Follow this guide step-by-step
