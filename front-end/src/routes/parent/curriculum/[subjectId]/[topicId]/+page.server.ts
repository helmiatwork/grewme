import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { TOPIC_QUERY } from '$lib/api/queries/curriculum';
import type { Topic } from '$lib/api/types';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
  try {
    const data = await graphql<{ topic: Topic }>(
      TOPIC_QUERY,
      { id: params.topicId },
      locals.accessToken!
    );

    return { topic: data.topic };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
