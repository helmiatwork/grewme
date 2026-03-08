import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server.js';
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
  return paraglideMiddleware(event.request, ({ request, locale }) => {
    // Update the event request with the (potentially delocalized) request
    event.request = request;

    return handleAuth({ event, resolve });
  });
};

async function handleAuth({ event, resolve }: { event: any; resolve: any }) {
  const { cookies, url } = event;
  const isPublic = PUBLIC_PATHS.some((p) => url.pathname.startsWith(p));

  let accessToken: string | null = getAccessToken(cookies) ?? null;
  let user = accessToken ? decodeJwtPayload(accessToken) : null;

  // Try refresh if access token is expired OR missing (cookie may have been
  // deleted by the browser after maxAge). The refresh token cookie lasts 30
  // days, so we can silently re-issue a new access token.
  const needsRefresh = !accessToken || isTokenExpired(accessToken);

  if (needsRefresh) {
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
    } else if (!accessToken) {
      // No access token AND no refresh token — truly unauthenticated
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
  // But allow access to /login if there's a ?force param (for clearing stale sessions)
  if (user && (url.pathname === '/login' || url.pathname === '/register')) {
    if (url.searchParams.has('force')) {
      clearAuthCookies(cookies);
      event.locals.user = null;
      event.locals.accessToken = null;
    } else {
      const dashboard = user.type === 'Teacher'
        ? '/teacher/dashboard'
        : user.type === 'SchoolManager'
          ? '/school/dashboard'
          : '/parent/dashboard';
      throw redirect(303, dashboard);
    }
  }

  // Role-based route guards
  const getDashboard = (type: string) =>
    type === 'Teacher' ? '/teacher/dashboard' : type === 'SchoolManager' ? '/school/dashboard' : '/parent/dashboard';

  if (user && url.pathname.startsWith('/teacher') && user.type !== 'Teacher') {
    throw redirect(303, getDashboard(user.type));
  }
  if (user && url.pathname.startsWith('/parent') && user.type !== 'Parent') {
    throw redirect(303, getDashboard(user.type));
  }
  if (user && url.pathname.startsWith('/school') && user.type !== 'SchoolManager') {
    throw redirect(303, getDashboard(user.type));
  }

  return resolve(event);
}
