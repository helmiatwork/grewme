import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { graphql } from '$lib/api/client';
import { REGISTER_MUTATION } from '$lib/api/queries/auth';
import { setAuthCookies } from '$lib/api/auth';
import type { AuthPayload } from '$lib/api/types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const input = await request.json();

  const data = await graphql<{ register: AuthPayload }>(REGISTER_MUTATION, { input });

  const result = data.register;

  if (result.errors.length > 0) {
    return json({ errors: result.errors }, { status: 422 });
  }

  if (result.accessToken && result.refreshToken && result.expiresIn) {
    setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, input.role);
  }

  return json({
    user: result.user,
    role: input.role
  });
};
