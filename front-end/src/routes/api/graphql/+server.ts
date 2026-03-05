import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { graphql, GraphQLError } from '$lib/api/client';
import { getAccessToken } from '$lib/api/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = getAccessToken(cookies);

  if (!token) {
    return json({ errors: [{ message: 'Not authenticated' }] }, { status: 401 });
  }

  const { query, variables } = await request.json();

  try {
    const data = await graphql(query, variables, token);
    return json({ data });
  } catch (err) {
    if (err instanceof GraphQLError) {
      return json({ errors: err.errors }, { status: 200 });
    }
    return json({ errors: [{ message: 'Internal server error' }] }, { status: 500 });
  }
};
