import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { authService } from '../../services/authService';

const API_URL = 'http://localhost:8080';

interface User {
  id: number;
  email: string;
  full_name: string;
  watch_history: any[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchedCount, setWatchedCount] = useState(0);
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Refresh user data when profile tab is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('👤 Profile tab focused - refreshing user data');
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const token = await authService.getToken();
      console.log('📱 Fetching user data... Token:', token ? '✅ Found' : '❌ Not found');
      
      if (token) {
        console.log('   Token preview:', token.substring(0, 30) + '...');
        console.log('   Token length:', token.length);
      }
      
      if (!token) {
        // User not signed in - show guest mode
        console.log('⚠️  No token - showing guest mode');
        return;
      }
      
      console.log('📡 Sending request to /api/users/me with Authorization header');
      const response = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ User data fetched:', response.data);
      setUser(response.data);
    } catch (error: any) {
      console.error('❌ Error fetching user data:', error.message);
      console.error('   Status:', error.response?.status);
      console.error('   Data:', error.response?.data);
      console.error('   Headers sent:', error.config?.headers);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔐 Signing out...');
              
              // Clear auth data
              await authService.logout();
              console.log('✅ Auth data cleared');
              
              setUser(null);
              
              // Wait a bit for state to update
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // Force navigation to signin
              console.log('🔄 Navigating to signin page...');
              
              // Use router.push instead of replace to ensure navigation works
              router.push('/auth/signin' as any);
              
              // Also try replace as backup
              setTimeout(() => {
                router.replace('/auth/signin' as any);
              }, 500);
              
            } catch (error) {
              console.error('❌ Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get help', action: () => Alert.alert('Help & Support', 'Coming soon!') },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={48} color="#fff" />
          </View>
        </View>
        <Text style={styles.userName}>{user?.full_name || 'Guest User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'guest@streamify.com'}</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('Edit Profile', 'Coming soon!')}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{watchedCount}</Text>
          <Text style={styles.statLabel}>Watched</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{watchlistCount}</Text>
          <Text style={styles.statLabel}>Watchlist</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.action}>
            <View style={styles.menuIconContainer}>
              <Ionicons name={item.icon as any} size={24} color="#fff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#ff4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Streamify v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  signOutText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
});
