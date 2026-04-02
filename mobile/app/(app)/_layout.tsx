import { ApolloProvider } from '@apollo/client';
import { Slot, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../src/auth/store';
import { apolloClient, clearAuthCallback } from '../../src/graphql/client';

export default function AppLayout() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    clearAuthCallback.current = () => {
      useAuthStore.getState().clearAuth();
      router.replace('/(auth)/login');
    };

    return () => {
      clearAuthCallback.current = null;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      router.replace('/(auth)/login');
    }
  }, [token]);

  if (!token) {
    return null;
  }

  return (
    <ApolloProvider client={apolloClient}>
      <Slot />
    </ApolloProvider>
  );
}
