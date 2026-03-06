import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { EXAM_QUERY } from '$lib/api/queries/curriculum';
import type { Exam } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  try {
    const data = await graphql<{ exam: Exam }>(
      EXAM_QUERY,
      { id: params.examId },
      locals.accessToken!
    );

    return { exam: data.exam };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
