import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container} testID="error-state">
      <Text style={styles.icon}>!</Text>
      <Text style={styles.message} testID="error-message">
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          style={styles.retryButton}
          onPress={onRetry}
          testID="error-retry-button"
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
    width: 48,
    height: 48,
    lineHeight: 48,
    textAlign: 'center',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F44336',
    overflow: 'hidden',
  },
  message: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
