import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  from,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { useAuthStore } from '../auth/store';

/**
 * Ref object that screens can populate with a callback to handle auth clearing.
 * This avoids a circular dependency between the Apollo client and navigation.
 *
 * Usage in the root layout:
 *   clearAuthCallback.current = () => { useAuthStore.getState().clearAuth(); router.replace('/login') }
 */
export const clearAuthCallback: { current: (() => void) | null } = {
  current: null,
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const httpLink = new HttpLink({
  uri: `${API_URL}/graphql`,
});

const authLink = new ApolloLink((operation, forward) => {
  const token = useAuthStore.getState().token;
  if (token) {
    operation.setContext({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return forward(operation);
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (
        err.extensions?.code === 'UNAUTHENTICATED' ||
        err.message === 'Not authenticated'
      ) {
        clearAuthCallback.current?.();
        break;
      }
    }
  }

  if (networkError && 'statusCode' in networkError) {
    const status = (networkError as { statusCode: number }).statusCode;
    if (status === 401) {
      clearAuthCallback.current?.();
    }
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
