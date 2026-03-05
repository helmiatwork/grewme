import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import { clearAuthCookies } from '$lib/api/auth';
import type { Classroom } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const data = await graphql<{ classrooms: Classroom[] }>(
      CLASSROOMS_QUERY,
      {},
      locals.accessToken!
    );

    return {
      classrooms: data.classrooms
    };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
