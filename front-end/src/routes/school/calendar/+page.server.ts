import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { CLASSROOM_EVENTS_QUERY } from '$lib/api/queries/calendar';
import { SCHOOL_CLASSROOMS_QUERY } from '$lib/api/queries/school';
import { clearAuthCookies } from '$lib/api/auth';
import type { ClassroomEvent } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  const today = new Date();
  const month = today.toISOString().split('T')[0];

  try {
    const [classroomsData, eventsData] = await Promise.all([
      graphql<{ classrooms: Array<{ id: string; name: string }> }>(
        SCHOOL_CLASSROOMS_QUERY, {}, locals.accessToken!
      ),
      graphql<{ classroomEvents: ClassroomEvent[] }>(
        CLASSROOM_EVENTS_QUERY, { month }, locals.accessToken!
      )
    ]);

    return {
      classrooms: classroomsData.classrooms,
      events: eventsData.classroomEvents
    };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
