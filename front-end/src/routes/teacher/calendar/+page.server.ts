import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import { CLASSROOM_EVENTS_QUERY } from '$lib/api/queries/calendar';
import type { Classroom, ClassroomEvent } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals }) => {
  const today = new Date();
  const month = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const [classroomsData, eventsData] = await Promise.all([
    graphql<{ classrooms: Classroom[] }>(CLASSROOMS_QUERY, {}, locals.accessToken!),
    graphql<{ classroomEvents: ClassroomEvent[] }>(CLASSROOM_EVENTS_QUERY, { month }, locals.accessToken!)
  ]);

  return {
    classrooms: classroomsData.classrooms,
    events: eventsData.classroomEvents
  };
};
