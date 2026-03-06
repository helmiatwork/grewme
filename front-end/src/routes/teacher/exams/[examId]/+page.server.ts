import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import { EXAM_QUERY, ASSIGN_EXAM_MUTATION } from '$lib/api/queries/curriculum';
import type { Classroom, Exam } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  try {
    const token = locals.accessToken!;

    const [examData, classroomsData] = await Promise.all([
      graphql<{ exam: Exam }>(EXAM_QUERY, { id: params.examId }, token),
      graphql<{ classrooms: Classroom[] }>(CLASSROOMS_QUERY, {}, token)
    ]);

    return {
      exam: examData.exam,
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
  assign: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    const examId = formData.get('examId') as string;
    const classroomId = formData.get('classroomId') as string;
    const scheduledAt = formData.get('scheduledAt') as string;
    const dueAt = formData.get('dueAt') as string;

    if (!classroomId) return fail(400, { assignError: 'Please select a classroom' });

    try {
      const data = await graphql<{
        assignExamToClassroom: { classroomExam: { id: string } | null; errors: string[] };
      }>(
        ASSIGN_EXAM_MUTATION,
        {
          input: {
            examId,
            classroomId,
            scheduledAt: scheduledAt || null,
            dueAt: dueAt || null
          }
        },
        locals.accessToken!
      );

      if (data.assignExamToClassroom.errors?.length) {
        return fail(422, { assignError: data.assignExamToClassroom.errors.join(', ') });
      }

      return { assignSuccess: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { assignError: 'Failed to assign exam' });
    }
  }
};
