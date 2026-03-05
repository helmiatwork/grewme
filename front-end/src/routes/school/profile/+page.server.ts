import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { ME_QUERY } from '$lib/api/queries/auth';
import { clearAuthCookies } from '$lib/api/auth';
import type { User } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const data = await graphql<{ me: User }>(ME_QUERY, {}, locals.accessToken!);
    return { profile: data.me };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
