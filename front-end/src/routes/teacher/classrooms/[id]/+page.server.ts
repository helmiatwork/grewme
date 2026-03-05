import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOM_QUERY, CLASSROOM_OVERVIEW_QUERY } from '$lib/api/queries/classrooms';
import type { Classroom, ClassroomOverview } from '$lib/api/types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const [classroomData, overviewData] = await Promise.all([
    graphql<{ classroom: Classroom }>(CLASSROOM_QUERY, { id: params.id }, locals.accessToken!),
    graphql<{ classroomOverview: ClassroomOverview }>(
      CLASSROOM_OVERVIEW_QUERY,
      { classroomId: params.id },
      locals.accessToken!
    )
  ]);

  return {
    classroom: classroomData.classroom,
    overview: overviewData.classroomOverview
  };
};
