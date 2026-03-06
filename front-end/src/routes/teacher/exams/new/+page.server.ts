import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import { CREATE_EXAM_MUTATION } from '$lib/api/queries/curriculum';
import type { Classroom } from '$lib/api/types';

const SUBJECTS_WITH_TOPICS_QUERY = `
  query SubjectsWithTopics($schoolId: ID!) {
    subjects(schoolId: $schoolId) {
      id
      name
      topics {
        id
        name
        position
      }
    }
  }
`;

interface SubjectWithTopics {
  id: string;
  name: string;
  topics: Array<{ id: string; name: string; position: number }>;
}

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const token = locals.accessToken!;

    const classroomsData = await graphql<{ classrooms: Classroom[] }>(
      CLASSROOMS_QUERY,
      {},
      token
    );
    const classrooms = classroomsData.classrooms;
    const schoolId = classrooms[0]?.school?.id;

    if (!schoolId) {
      return { subjects: [], classrooms, schoolId: null };
    }

    const subjectsData = await graphql<{ subjects: SubjectWithTopics[] }>(
      SUBJECTS_WITH_TOPICS_QUERY,
      { schoolId },
      token
    );

    return {
      subjects: subjectsData.subjects,
      classrooms,
      schoolId
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
  create: async ({ request, locals, cookies }) => {
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const examType = formData.get('examType') as string;
    const topicId = formData.get('topicId') as string;
    const maxScore = formData.get('maxScore') as string;
    const durationMinutes = formData.get('durationMinutes') as string;

    if (!title?.trim()) return fail(400, { error: 'Title is required' });
    if (!examType) return fail(400, { error: 'Exam type is required' });
    if (!topicId) return fail(400, { error: 'Topic is required' });

    // Parse questions (MULTIPLE_CHOICE / SCORE_BASED)
    const questionsRaw = formData.get('questions') as string | null;
    let questions: Array<{
      questionText: string;
      questionType: string;
      options?: string[];
      correctAnswer?: string;
      points: number;
      position: number;
    }> | undefined;

    if (questionsRaw) {
      try {
        questions = JSON.parse(questionsRaw);
      } catch {
        return fail(400, { error: 'Invalid questions data' });
      }
    }

    // Parse rubric criteria
    const criteriaRaw = formData.get('rubricCriteria') as string | null;
    let rubricCriteria: Array<{
      name: string;
      description?: string;
      maxScore: number;
      position: number;
    }> | undefined;

    if (criteriaRaw) {
      try {
        rubricCriteria = JSON.parse(criteriaRaw);
      } catch {
        return fail(400, { error: 'Invalid rubric criteria data' });
      }
    }

    const input: Record<string, unknown> = {
      title: title.trim(),
      description: description?.trim() || null,
      examType,
      topicId,
      maxScore: maxScore ? parseInt(maxScore, 10) : null,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null
    };

    if (questions?.length) input.questions = questions;
    if (rubricCriteria?.length) input.rubricCriteria = rubricCriteria;

    try {
      const data = await graphql<{
        createExam: { exam: { id: string } | null; errors: string[] };
      }>(CREATE_EXAM_MUTATION, { input }, locals.accessToken!);

      if (data.createExam.errors?.length) {
        return fail(422, { error: data.createExam.errors.join(', ') });
      }

      throw redirect(303, `/teacher/exams/${data.createExam.exam!.id}`);
    } catch (err) {
      if (err instanceof Response) throw err; // re-throw redirect
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { error: 'Failed to create exam' });
    }
  }
};
