import { env } from '$env/dynamic/private';

const GRAPHQL_URL = env.RAILS_GRAPHQL_URL || 'http://localhost:3000/graphql';

export class GraphQLError extends Error {
  errors: Array<{ message: string; path?: string[] }>;

  constructor(errors: Array<{ message: string; path?: string[] }>) {
    super(errors.map((e) => e.message).join(', '));
    this.name = 'GraphQLError';
    this.errors = errors;
  }
}

export async function graphql<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new GraphQLError(json.errors);
  }
  return json.data as T;
}
