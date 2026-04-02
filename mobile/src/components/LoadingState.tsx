import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message }: LoadingStateProps) {
  return (
    <View style={styles.container} testID="loading-state">
      <ActivityIndicator
        size="large"
        color="#4CAF50"
        testID="loading-spinner"
      />
      {message ? (
        <Text style={styles.message} testID="loading-message">
          {message}
        </Text>
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
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
