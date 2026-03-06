import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { graphql } from '$lib/api/client';
import { REFRESH_TOKEN_MUTATION } from '$lib/api/queries/auth';
import { getRefreshToken, getRole, setAuthCookies, clearAuthCookies } from '$lib/api/auth';

export const POST: RequestHandler = async ({ cookies }) => {
  const refreshToken = getRefreshToken(cookies);
  const role = getRole(cookies);

  if (!refreshToken || !role) {
    clearAuthCookies(cookies);
    return json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const data = await graphql<{
      refreshToken: {
        accessToken: string | null;
        refreshToken: string | null;
        expiresIn: number | null;
        errors: Array<{ message: string; path: string[] }>;
      };
    }>(REFRESH_TOKEN_MUTATION, { refreshToken, role });

    const result = data.refreshToken;

    if (result.errors.length > 0) {
      clearAuthCookies(cookies);
      return json({ errors: result.errors }, { status: 401 });
    }

    if (result.accessToken && result.refreshToken && result.expiresIn) {
      setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, role);
    }

    return json({ success: true, accessToken: result.accessToken });
  } catch {
    clearAuthCookies(cookies);
    return json({ error: 'Refresh failed' }, { status: 401 });
  }
};
