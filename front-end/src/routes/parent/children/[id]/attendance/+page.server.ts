import { graphql } from '$lib/api/client';
import { STUDENT_ATTENDANCE_QUERY } from '$lib/api/queries/attendance';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('access_token');
  if (!token) return { records: [], studentId: params.id };

  try {
    const result = await graphql<any>(STUDENT_ATTENDANCE_QUERY, {
      studentId: params.id
    }, token);
    return {
      records: result.studentAttendance ?? [],
      studentId: params.id
    };
  } catch (e) {
    return { records: [], studentId: params.id, error: (e as Error).message };
  }
};
