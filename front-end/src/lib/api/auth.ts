import type { Cookies } from '@sveltejs/kit';
import type { SessionUser } from './types';

const ACCESS_COOKIE = 'grewme_access';
const REFRESH_COOKIE = 'grewme_refresh';
const ROLE_COOKIE = 'grewme_role';

const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: false, // Set to true in production
  sameSite: 'lax' as const
};

export function setAuthCookies(
  cookies: Cookies,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  role: string
): void {
  cookies.set(ACCESS_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: expiresIn // 10 min — matches JWT expiration
  });
  cookies.set(REFRESH_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
  cookies.set(ROLE_COOKIE, role, {
    ...COOKIE_OPTIONS,
    httpOnly: false, // Client needs to read role for redirects
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAuthCookies(cookies: Cookies): void {
  cookies.delete(ACCESS_COOKIE, { path: '/' });
  cookies.delete(REFRESH_COOKIE, { path: '/' });
  cookies.delete(ROLE_COOKIE, { path: '/' });
}

export function getAccessToken(cookies: Cookies): string | undefined {
  return cookies.get(ACCESS_COOKIE);
}

export function getRefreshToken(cookies: Cookies): string | undefined {
  return cookies.get(REFRESH_COOKIE);
}

export function getRole(cookies: Cookies): string | undefined {
  return cookies.get(ROLE_COOKIE);
}

/**
 * Decode JWT payload without verification (Rails verifies).
 * Used to extract user info for locals.
 */
export function decodeJwtPayload(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.sub,
      type: payload.type,
      email: payload.email || ''
    };
  } catch {
    return null;
  }
}

/**
 * Check if JWT is expired (with 30s buffer for clock skew).
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp * 1000 < Date.now() - 30_000;
  } catch {
    return true;
  }
}
