import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { SCHOOL_TEACHERS_QUERY, SCHOOL_CLASSROOMS_QUERY } from '$lib/api/queries/school';
import { clearAuthCookies } from '$lib/api/auth';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

interface SchoolTeacher {
  id: string;
  name: string;
  email: string;
  classrooms: Array<{ id: string; name: string }>;
}

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const [teachersData, classroomsData] = await Promise.all([
      graphql<{ schoolTeachers: SchoolTeacher[] }>(SCHOOL_TEACHERS_QUERY, {}, locals.accessToken!),
      graphql<{ classrooms: Array<{ id: string; name: string }> }>(SCHOOL_CLASSROOMS_QUERY, {}, locals.accessToken!)
    ]);
    return {
      teachers: teachersData.schoolTeachers,
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

export const actions: Actions = {
  assign: async ({ request, locals, fetch }) => {
    const formData = await request.formData();
    const teacherId = formData.get('teacherId') as string;
    const classroomId = formData.get('classroomId') as string;
    const role = formData.get('role') as string;

    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation($teacherId: ID!, $classroomId: ID!, $role: String!) {
          assignTeacherToClassroom(teacherId: $teacherId, classroomId: $classroomId, role: $role) {
            classroomTeacher { id }
            errors { message }
          }
        }`,
        variables: { teacherId, classroomId, role }
      })
    });
    const json = await res.json();
    const errors = json.data?.assignTeacherToClassroom?.errors ?? [];
    if (errors.length > 0) return fail(400, { error: errors[0].message });
    return { success: true };
  },
  remove: async ({ request, fetch }) => {
    const formData = await request.formData();
    const teacherId = formData.get('teacherId') as string;
    const classroomId = formData.get('classroomId') as string;

    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation($teacherId: ID!, $classroomId: ID!) {
          removeTeacherFromClassroom(teacherId: $teacherId, classroomId: $classroomId) {
            success
            errors { message }
          }
        }`,
        variables: { teacherId, classroomId }
      })
    });
    const json = await res.json();
    const errors = json.data?.removeTeacherFromClassroom?.errors ?? [];
    if (errors.length > 0) return fail(400, { error: errors[0].message });
    return { success: true };
  }
};
