import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { STUDENT_WEEKLY_REPORT_QUERY } from '$lib/api/queries/behavior';

const STUDENT_NAME_QUERY = `
  query StudentName($id: ID!) {
    student(id: $id) {
      id
      name
    }
  }
`;

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const [weeklyData, studentData] = await Promise.all([
      graphql<{ studentWeeklyReport: any[] }>(
        STUDENT_WEEKLY_REPORT_QUERY,
        { studentId: params.id },
        locals.accessToken!
      ),
      graphql<{ student: { id: string; name: string } }>(
        STUDENT_NAME_QUERY,
        { id: params.id },
        locals.accessToken!
      ).catch(() => ({ student: { id: params.id, name: '' } }))
    ]);

    return {
      studentId: params.id,
      studentName: studentData?.student?.name ?? '',
      weeklyReports: weeklyData.studentWeeklyReport ?? []
    };
  } catch {
    return { studentId: params.id, studentName: '', weeklyReports: [] };
  }
};
