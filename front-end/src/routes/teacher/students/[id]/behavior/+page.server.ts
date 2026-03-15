import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { STUDENT_BEHAVIOR_HISTORY_QUERY } from '$lib/api/queries/behavior';

const STUDENT_NAME_QUERY = `
  query StudentName($id: ID!) {
    student(id: $id) {
      id
      name
    }
  }
`;

export const load: PageServerLoad = async ({ params, locals }) => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  try {
    const [historyData, studentData] = await Promise.all([
      graphql<{ studentBehaviorHistory: any[] }>(
        STUDENT_BEHAVIOR_HISTORY_QUERY,
        { studentId: params.id, startDate: weekStartStr, endDate: todayStr },
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
      history: historyData.studentBehaviorHistory ?? [],
      initialStartDate: weekStartStr,
      initialEndDate: todayStr
    };
  } catch {
    return {
      studentId: params.id,
      studentName: '',
      history: [],
      initialStartDate: weekStartStr,
      initialEndDate: todayStr
    };
  }
};
