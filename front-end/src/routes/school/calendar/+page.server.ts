import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { CLASSROOM_EVENTS_QUERY } from '$lib/api/queries/calendar';
import { clearAuthCookies } from '$lib/api/auth';
import type { ClassroomEvent } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  const monthParam = url.searchParams.get('month');
  const month = monthParam || new Date().toISOString().slice(0, 10);

  try {
    const data = await graphql<{ classroomEvents: ClassroomEvent[] }>(
      CLASSROOM_EVENTS_QUERY, { month }, locals.accessToken!
    );
    return { events: data.classroomEvents, month };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
