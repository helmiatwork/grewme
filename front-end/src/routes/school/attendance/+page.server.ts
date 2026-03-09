import { graphql } from '$lib/api/client';
import { CLASSROOM_ATTENDANCE_SUMMARY_QUERY } from '$lib/api/queries/attendance';
import type { PageServerLoad, Actions } from './$types';

const SCHOOL_CLASSROOMS_QUERY = `
  query SchoolOverview {
    schoolOverview {
      classrooms { id name grade }
    }
  }
`;

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.accessToken;
  if (!token) return { classrooms: [] };
  try {
    const data = await graphql<any>(SCHOOL_CLASSROOMS_QUERY, {}, token);
    return { classrooms: data.schoolOverview?.classrooms ?? [] };
  } catch { return { classrooms: [] }; }
};

export const actions: Actions = {
  loadSummary: async ({ request, locals }) => {
    const token = locals.accessToken;
    const formData = await request.formData();
    const classroomId = formData.get('classroomId') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    try {
      const result = await graphql<any>(CLASSROOM_ATTENDANCE_SUMMARY_QUERY, {
        classroomId, startDate, endDate
      }, token);
      return {
        summary: result.classroomAttendanceSummary ?? [],
        classroomId, startDate, endDate
      };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
};
