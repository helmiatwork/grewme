import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { EXAM_SUBMISSION_QUERY, GRADE_EXAM_SUBMISSION_MUTATION } from '$lib/api/queries/curriculum';
import type { ExamSubmission } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  try {
    const data = await graphql<{ examSubmission: ExamSubmission }>(
      EXAM_SUBMISSION_QUERY,
      { id: params.submissionId },
      locals.accessToken!
    );

    return { submission: data.examSubmission };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};

export const actions: Actions = {
  grade: async ({ request, locals, cookies, params }) => {
    const formData = await request.formData();

    const teacherNotes = formData.get('teacherNotes') as string;
    const passed = formData.get('passed') as string;

    // Parse question scores: questionScores[questionId] = score
    const questionScoresRaw = formData.get('questionScores') as string | null;
    let questionScores: Array<{ examQuestionId: string; score: number }> | undefined;
    if (questionScoresRaw) {
      try {
        questionScores = JSON.parse(questionScoresRaw);
      } catch {
        return fail(400, { error: 'Invalid question scores' });
      }
    }

    // Parse rubric scores: rubricScores[criteriaId] = { score, comment }
    const rubricScoresRaw = formData.get('rubricScores') as string | null;
    let rubricScores: Array<{ rubricCriteriaId: string; score: number; comment?: string }> | undefined;
    if (rubricScoresRaw) {
      try {
        rubricScores = JSON.parse(rubricScoresRaw);
      } catch {
        return fail(400, { error: 'Invalid rubric scores' });
      }
    }

    const input: Record<string, unknown> = {
      submissionId: params.submissionId,
      teacherNotes: teacherNotes?.trim() || null
    };

    if (questionScores?.length) input.questionScores = questionScores;
    if (rubricScores?.length) input.rubricScores = rubricScores;
    if (passed !== null && passed !== undefined) input.passed = passed === 'true';

    try {
      const data = await graphql<{
        gradeExamSubmission: {
          examSubmission: { id: string } | null;
          errors: string[];
        };
      }>(GRADE_EXAM_SUBMISSION_MUTATION, { input }, locals.accessToken!);

      if (data.gradeExamSubmission.errors?.length) {
        return fail(422, { error: data.gradeExamSubmission.errors.join(', ') });
      }

      throw redirect(303, `/teacher/exams/${params.examId}`);
    } catch (err) {
      if (err instanceof Response) throw err;
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { error: 'Failed to submit grade' });
    }
  }
};
