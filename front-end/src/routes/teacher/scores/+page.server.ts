import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOMS_QUERY, CLASSROOM_QUERY } from '$lib/api/queries/classrooms';
import { CREATE_DAILY_SCORE_MUTATION } from '$lib/api/queries/students';
import type { Classroom } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const data = await graphql<{ classrooms: Classroom[] }>(
    CLASSROOMS_QUERY,
    {},
    locals.accessToken!
  );

  // If a classroom is selected, load its students
  const classroomId = url.searchParams.get('classroom');
  let students: Array<{ id: string; name: string }> = [];

  if (classroomId) {
    const classroomData = await graphql<{ classroom: Classroom }>(
      CLASSROOM_QUERY,
      { id: classroomId },
      locals.accessToken!
    );
    students = classroomData.classroom.students ?? [];
  }

  return {
    classrooms: data.classrooms,
    selectedClassroom: classroomId,
    selectedStudent: url.searchParams.get('student'),
    students
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const studentId = formData.get('studentId') as string;
    const date = formData.get('date') as string;
    const skillCategory = formData.get('skillCategory') as string;
    const score = parseInt(formData.get('score') as string, 10);

    if (!studentId || !date || !skillCategory || isNaN(score)) {
      return fail(400, { error: 'All fields are required' });
    }

    if (score < 0 || score > 100) {
      return fail(400, { error: 'Score must be between 0 and 100' });
    }

    try {
      const data = await graphql<{
        createDailyScore: {
          dailyScore: { id: string } | null;
          errors: Array<{ message: string; path: string[] }>;
        };
      }>(
        CREATE_DAILY_SCORE_MUTATION,
        {
          input: {
            studentId,
            date,
            skillCategory: skillCategory.toLowerCase(),
            score
          }
        },
        locals.accessToken!
      );

      const result = data.createDailyScore;

      if (result.errors.length > 0) {
        return fail(422, { error: result.errors[0].message });
      }

      return { success: true };
    } catch {
      return fail(500, { error: 'Something went wrong' });
    }
  }
};
