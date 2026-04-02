import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../../../src/auth/store';

export default function ParentProfileScreen() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container} testID="parent-profile-screen">
      <View style={styles.card}>
        <Text style={styles.roleLabel}>Role</Text>
        <Text style={styles.roleValue}>Parent</Text>
      </View>

      <Pressable
        style={styles.menuItem}
        onPress={() => router.push('/parent/leave-requests')}
        testID="leave-requests-link"
      >
        <Ionicons name="document-text-outline" size={20} color="#4CAF50" />
        <Text style={styles.menuItemText}>Leave Requests</Text>
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </Pressable>

      <Pressable
        style={styles.menuItem}
        onPress={() => router.push('/parent/data-rights')}
        testID="data-rights-link"
      >
        <Ionicons name="shield-checkmark-outline" size={20} color="#1565C0" />
        <Text style={styles.menuItemText}>Data Rights (COPPA)</Text>
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </Pressable>

      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
        testID="logout-button"
      >
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  roleValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#C62828',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
