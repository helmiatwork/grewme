import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOM_EVENTS_QUERY } from '$lib/api/queries/calendar';
import type { ClassroomEvent } from '$lib/api/types';

const CHILDREN_WITH_CLASSROOMS_QUERY = `
  query MyChildren {
    myChildren {
      id
      name
      classrooms { id name }
    }
  }
`;

export const load: PageServerLoad = async ({ locals }) => {
  const today = new Date();
  const month = today.toISOString().split('T')[0];

  const [childrenData, eventsData] = await Promise.all([
    graphql<{ myChildren: Array<{ id: string; name: string; classrooms: Array<{ id: string; name: string }> }> }>(
      CHILDREN_WITH_CLASSROOMS_QUERY,
      {},
      locals.accessToken!
    ),
    graphql<{ classroomEvents: ClassroomEvent[] }>(
      CLASSROOM_EVENTS_QUERY,
      { month },
      locals.accessToken!
    )
  ]);

  // Extract unique classrooms from children
  const classroomMap = new Map<string, { id: string; name: string }>();
  for (const child of childrenData.myChildren) {
    for (const classroom of child.classrooms ?? []) {
      classroomMap.set(classroom.id, classroom);
    }
  }

  return {
    classrooms: Array.from(classroomMap.values()),
    events: eventsData.classroomEvents
  };
};
