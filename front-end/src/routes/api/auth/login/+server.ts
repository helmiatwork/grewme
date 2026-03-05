import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { graphql } from '$lib/api/client';
import { LOGIN_MUTATION } from '$lib/api/queries/auth';
import { setAuthCookies } from '$lib/api/auth';
import type { AuthPayload } from '$lib/api/types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { email, password, role } = await request.json();

  const data = await graphql<{ login: AuthPayload }>(LOGIN_MUTATION, {
    email,
    password,
    role
  });

  const result = data.login;

  if (result.errors.length > 0) {
    return json({ errors: result.errors }, { status: 401 });
  }

  if (result.accessToken && result.refreshToken && result.expiresIn) {
    setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, role);
  }

  return json({
    user: result.user,
    role
  });
};
