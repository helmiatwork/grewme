import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { SUBJECTS_QUERY } from '$lib/api/queries/curriculum';
import { ACADEMIC_YEARS_QUERY, GRADE_CURRICULUM_QUERY, SAVE_GRADE_CURRICULUM_MUTATION } from '$lib/api/queries/yearly-curriculum';
import type { Subject, AcademicYear, GradeCurriculum } from '$lib/api/types';

const ME_QUERY = `
  query {
    me {
      ... on SchoolManager {
        id
        school { id name minGrade maxGrade }
      }
    }
  }
`;

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  try {
    const meData = await graphql<{
      me: { id: string; school: { id: string; name: string; minGrade: number; maxGrade: number } };
    }>(ME_QUERY, {}, locals.accessToken!);

    const school = meData.me?.school;
    if (!school) {
      return { subjects: [], academicYears: [], school: null, gradeCurriculum: null, selectedYearId: null, selectedGrade: null };
    }

    const [subjectsData, yearsData] = await Promise.all([
      graphql<{ subjects: Subject[] }>(SUBJECTS_QUERY, { schoolId: school.id }, locals.accessToken!),
      graphql<{ academicYears: AcademicYear[] }>(ACADEMIC_YEARS_QUERY, { schoolId: school.id }, locals.accessToken!)
    ]);

    const selectedYearId = url.searchParams.get('yearId') || yearsData.academicYears.find(y => y.current)?.id || yearsData.academicYears[0]?.id || null;
    const selectedGrade = Number(url.searchParams.get('grade')) || school.minGrade;

    let gradeCurriculum: GradeCurriculum | null = null;
    if (selectedYearId && selectedGrade) {
      const gcData = await graphql<{ gradeCurriculum: GradeCurriculum | null }>(
        GRADE_CURRICULUM_QUERY,
        { academicYearId: selectedYearId, grade: selectedGrade },
        locals.accessToken!
      );
      gradeCurriculum = gcData.gradeCurriculum;
    }

    return {
      subjects: subjectsData.subjects,
      academicYears: yearsData.academicYears,
      school,
      gradeCurriculum,
      selectedYearId,
      selectedGrade
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
  save: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    const academicYearId = formData.get('academicYearId') as string;
    const grade = Number(formData.get('grade'));
    const itemsJson = formData.get('items') as string;

    if (!academicYearId || !grade || !itemsJson) {
      return fail(400, { error: 'Missing required fields' });
    }

    try {
      const items = JSON.parse(itemsJson);
      const data = await graphql<{
        saveGradeCurriculum: { gradeCurriculum: GradeCurriculum | null; errors: { message: string; path: string[] }[] };
      }>(
        SAVE_GRADE_CURRICULUM_MUTATION,
        { input: { academicYearId, grade, items } },
        locals.accessToken!
      );

      if (data.saveGradeCurriculum.errors?.length) {
        return fail(422, { error: data.saveGradeCurriculum.errors.map(e => e.message).join(', ') });
      }

      return { success: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { error: 'Failed to save curriculum' });
    }
  }
};
