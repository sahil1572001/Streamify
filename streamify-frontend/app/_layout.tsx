import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { authService } from '../services/authService';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [segments]);

  const checkAuth = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      const inAuthGroup = segments[0] === 'auth';
      const inTabsGroup = segments[0] === '(tabs)';
      const inIndex = segments.length === 0;

      console.log(`🔍 Auth check: authenticated=${isAuthenticated}, inAuth=${inAuthGroup}, inTabs=${inTabsGroup}, inIndex=${inIndex}`);

      // On app launch (no segments), go directly to signin if not authenticated
      if (inIndex && !isAuthenticated) {
        console.log('🔄 App launch: Redirecting to signin (not authenticated)');
        router.replace('/auth/signin' as any);
        return;
      }

      // If not authenticated and not in auth screens, redirect to signin
      if (!isAuthenticated && !inAuthGroup && segments.length > 0) {
        console.log('🔄 Redirecting to signin (not authenticated)');
        router.replace('/auth/signin' as any);
      }
      // If authenticated and in auth screens, redirect to home
      else if (isAuthenticated && inAuthGroup) {
        console.log('🔄 Redirecting to home (already authenticated)');
        router.replace('/(tabs)' as any);
      }
      
      setIsReady(true);
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setIsReady(true);
    }
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/signin" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="movie/[id]" />
    </Stack>
  );
}
