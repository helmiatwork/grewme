import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import {
  getAccessToken,
  getRefreshToken,
  getRole,
  decodeJwtPayload,
  isTokenExpired,
  setAuthCookies,
  clearAuthCookies
} from '$lib/api/auth';
import { graphql } from '$lib/api/client';
import { REFRESH_TOKEN_MUTATION } from '$lib/api/queries/auth';

const PUBLIC_PATHS = ['/login', '/register', '/api/'];

export const handle: Handle = async ({ event, resolve }) => {
  const { cookies, url } = event;
  const isPublic = PUBLIC_PATHS.some((p) => url.pathname.startsWith(p));

  let accessToken: string | null = getAccessToken(cookies) ?? null;
  let user = accessToken ? decodeJwtPayload(accessToken) : null;

  // Try refresh if access token is expired
  if (accessToken && isTokenExpired(accessToken)) {
    const refreshToken = getRefreshToken(cookies);
    const role = getRole(cookies);

    if (refreshToken && role) {
      try {
        const data = await graphql<{
          refreshToken: {
            accessToken: string | null;
            refreshToken: string | null;
            expiresIn: number | null;
            errors: Array<{ message: string }>;
          };
        }>(REFRESH_TOKEN_MUTATION, { refreshToken, role });

        const result = data.refreshToken;
        if (result.accessToken && result.refreshToken && result.expiresIn) {
          setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, role);
          accessToken = result.accessToken;
          user = decodeJwtPayload(result.accessToken);
        } else {
          clearAuthCookies(cookies);
          accessToken = null;
          user = null;
        }
      } catch {
        clearAuthCookies(cookies);
        accessToken = null;
        user = null;
      }
    } else {
      clearAuthCookies(cookies);
      accessToken = null;
      user = null;
    }
  }

  event.locals.user = user;
  event.locals.accessToken = accessToken ?? null;

  // Redirect unauthenticated users from protected routes
  if (!isPublic && !user) {
    throw redirect(303, '/login');
  }

  // Redirect authenticated users away from login/register
  if (user && (url.pathname === '/login' || url.pathname === '/register')) {
    const dashboard = user.type === 'Teacher' ? '/teacher/dashboard' : '/parent/dashboard';
    throw redirect(303, dashboard);
  }

  // Role-based route guards
  if (user && url.pathname.startsWith('/teacher') && user.type !== 'Teacher') {
    throw redirect(303, '/parent/dashboard');
  }
  if (user && url.pathname.startsWith('/parent') && user.type !== 'Parent') {
    throw redirect(303, '/teacher/dashboard');
  }

  return resolve(event);
};
