import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TeacherLeaveRequestsScreen() {
  return (
    <View style={styles.container} testID="teacher-leave-requests-screen">
      <View style={styles.content}>
        <Ionicons name="document-text-outline" size={64} color="#CCC" />
        <Text style={styles.title}>Leave Requests</Text>
        <Text style={styles.subtitle}>
          Review and manage student leave requests from parents. This feature
          will be available in the next update.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
