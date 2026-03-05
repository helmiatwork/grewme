import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import type { Classroom } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals }) => {
  const data = await graphql<{ classrooms: Classroom[] }>(
    CLASSROOMS_QUERY,
    {},
    locals.accessToken!
  );

  return {
    classrooms: data.classrooms
  };
};
