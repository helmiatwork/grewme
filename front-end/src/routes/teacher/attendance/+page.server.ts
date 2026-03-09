import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import { CLASSROOM_ATTENDANCE_QUERY, BULK_RECORD_ATTENDANCE_MUTATION } from '$lib/api/queries/attendance';

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.accessToken;
  if (!token) return { classrooms: [] };

  try {
    const data = await graphql<any>(CLASSROOMS_QUERY, {}, token);
    return { classrooms: data.classrooms ?? [] };
  } catch {
    return { classrooms: [] };
  }
};

export const actions: Actions = {
  loadAttendance: async ({ request, locals }) => {
    const formData = await request.formData();
    const classroomId = formData.get('classroomId') as string;
    const date = formData.get('date') as string;

    if (!classroomId || !date) {
      return fail(400, { error: 'Missing classroom or date' });
    }

    try {
      const data = await graphql<any>(
        CLASSROOM_ATTENDANCE_QUERY,
        { classroomId, date },
        locals.accessToken!
      );
      return {
        records: data.classroomAttendance ?? [],
        classroomId,
        date
      };
    } catch (err) {
      return fail(422, { error: (err as Error).message });
    }
  },

  save: async ({ request, locals }) => {
    const formData = await request.formData();
    const classroomId = formData.get('classroomId') as string;
    const date = formData.get('date') as string;
    const recordsJson = formData.get('records') as string;

    if (!classroomId || !date || !recordsJson) {
      return fail(400, { error: 'Missing required fields' });
    }

    try {
      const records = JSON.parse(recordsJson);
      const data = await graphql<any>(
        BULK_RECORD_ATTENDANCE_MUTATION,
        { classroomId, date, records },
        locals.accessToken!
      );

      if (data.bulkRecordAttendance?.errors?.length > 0) {
        return fail(422, {
          error: data.bulkRecordAttendance.errors[0].message
        });
      }

      return { success: true, attendances: data.bulkRecordAttendance?.attendances ?? [] };
    } catch (err) {
      return fail(422, { error: (err as Error).message });
    }
  }
};
