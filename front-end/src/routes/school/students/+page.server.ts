import type { PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { SCHOOL_STUDENTS_QUERY } from '$lib/api/queries/school';
import { clearAuthCookies } from '$lib/api/auth';
import type { Actions } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const data = await graphql<{ classrooms: Array<{ id: string; name: string; students: Array<{ id: string; name: string }> }> }>(
      SCHOOL_STUDENTS_QUERY, {}, locals.accessToken!
    );
    return { classrooms: data.classrooms };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};

export const actions: Actions = {
  transfer: async ({ request, fetch }) => {
    const formData = await request.formData();
    const studentId = formData.get('studentId') as string;
    const fromClassroomId = formData.get('fromClassroomId') as string;
    const toClassroomId = formData.get('toClassroomId') as string;

    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation($studentId: ID!, $fromClassroomId: ID!, $toClassroomId: ID!) {
          transferStudent(studentId: $studentId, fromClassroomId: $fromClassroomId, toClassroomId: $toClassroomId) {
            success
            errors { message }
          }
        }`,
        variables: { studentId, fromClassroomId, toClassroomId }
      })
    });
    const json = await res.json();
    const errors = json.data?.transferStudent?.errors ?? [];
    if (errors.length > 0) return fail(400, { error: errors[0].message });
    return { success: true };
  }
};
