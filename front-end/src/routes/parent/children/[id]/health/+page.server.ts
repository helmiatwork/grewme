import { graphql } from '$lib/api/client';
import { STUDENT_HEALTH_CHECKUPS_QUERY } from '$lib/api/queries/health-checkups';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('access_token');
  if (!token) return { checkups: [], studentId: params.id };

  try {
    const result = await graphql<any>(STUDENT_HEALTH_CHECKUPS_QUERY, {
      studentId: params.id
    }, token);
    return {
      checkups: result.studentHealthCheckups ?? [],
      studentId: params.id
    };
  } catch (e) {
    return { checkups: [], studentId: params.id, error: (e as Error).message };
  }
};
