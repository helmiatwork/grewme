import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { graphql } from '$lib/api/client';
import { LOGOUT_MUTATION } from '$lib/api/queries/auth';
import { getAccessToken, clearAuthCookies } from '$lib/api/auth';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = getAccessToken(cookies);

  if (token) {
    try {
      await graphql(LOGOUT_MUTATION, {}, token);
    } catch {
      // Ignore errors — clear cookies regardless
    }
  }

  clearAuthCookies(cookies);
  return json({ success: true });
};
