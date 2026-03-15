import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOM_QUERY } from '$lib/api/queries/classrooms';
import type { Classroom } from '$lib/api/types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const classroomData = await graphql<{ classroom: Classroom }>(
    CLASSROOM_QUERY,
    { id: params.id },
    locals.accessToken!
  );

  return {
    classroom: classroomData.classroom
  };
};
