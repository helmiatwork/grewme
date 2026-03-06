import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { SUBJECT_QUERY } from '$lib/api/queries/curriculum';
import type { Subject } from '$lib/api/types';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
  try {
    const data = await graphql<{ subject: Subject }>(
      SUBJECT_QUERY,
      { id: params.subjectId },
      locals.accessToken!
    );

    return { subject: data.subject };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
