import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { SCHOOL_OVERVIEW_QUERY, SCHOOL_CLASSROOMS_QUERY } from '$lib/api/queries/school';
import { clearAuthCookies } from '$lib/api/auth';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const [overviewData, classroomsData] = await Promise.all([
      graphql<{ schoolOverview: { schoolName: string; classroomCount: number; studentCount: number; teacherCount: number } }>(
        SCHOOL_OVERVIEW_QUERY, {}, locals.accessToken!
      ),
      graphql<{ classrooms: Array<{ id: string; name: string; studentCount?: number }> }>(
        SCHOOL_CLASSROOMS_QUERY, {}, locals.accessToken!
      )
    ]);

    return {
      overview: overviewData.schoolOverview,
      classrooms: classroomsData.classrooms
    };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
