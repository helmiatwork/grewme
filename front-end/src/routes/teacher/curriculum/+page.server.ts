import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import {
  SUBJECTS_QUERY,
  CREATE_SUBJECT_MUTATION
} from '$lib/api/queries/curriculum';
import { ACADEMIC_YEARS_QUERY, GRADE_CURRICULUM_QUERY } from '$lib/api/queries/yearly-curriculum';
import type { Classroom, Subject, AcademicYear, GradeCurriculum } from '$lib/api/types';

const CLASSROOMS_WITH_GRADE_QUERY = `
  query {
    classrooms {
      id
      name
      grade
      school { id name minGrade maxGrade }
    }
  }
`;

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  try {
    const classroomsData = await graphql<{
      classrooms: (Classroom & { grade: number | null; school: { id: string; name: string; minGrade: number; maxGrade: number } })[];
    }>(CLASSROOMS_WITH_GRADE_QUERY, {}, locals.accessToken!);

    const classrooms = classroomsData.classrooms;
    const school = classrooms[0]?.school;

    if (!school) {
      return {
        subjects: [],
        schoolId: null,
        teacherGrades: [],
        school: null,
        currentAcademicYear: null,
        selectedGrade: null,
        gradeCurriculum: null
      };
    }

    // Get unique grades this teacher teaches
    const teacherGrades = [...new Set(classrooms.map(c => c.grade).filter((g): g is number => g !== null))].sort((a, b) => a - b);

    const [subjectsData, yearsData] = await Promise.all([
      graphql<{ subjects: Subject[] }>(SUBJECTS_QUERY, { schoolId: school.id }, locals.accessToken!),
      graphql<{ academicYears: AcademicYear[] }>(ACADEMIC_YEARS_QUERY, { schoolId: school.id }, locals.accessToken!)
    ]);

    const currentAcademicYear = yearsData.academicYears.find(y => y.current) || yearsData.academicYears[0] || null;
    const selectedGrade = url.searchParams.get('grade') ? Number(url.searchParams.get('grade')) : null;

    let gradeCurriculum: GradeCurriculum | null = null;
    if (selectedGrade && currentAcademicYear) {
      const gcData = await graphql<{ gradeCurriculum: GradeCurriculum | null }>(
        GRADE_CURRICULUM_QUERY,
        { academicYearId: currentAcademicYear.id, grade: selectedGrade },
        locals.accessToken!
      );
      gradeCurriculum = gcData.gradeCurriculum;
    }

    return {
      subjects: subjectsData.subjects,
      schoolId: school.id,
      teacherGrades,
      school,
      currentAcademicYear,
      selectedGrade,
      gradeCurriculum
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
  createSubject: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const schoolId = formData.get('schoolId') as string;

    if (!name?.trim()) {
      return fail(400, { error: 'Subject name is required' });
    }

    try {
      const data = await graphql<{
        createSubject: { subject: Subject | null; errors: string[] };
      }>(
        CREATE_SUBJECT_MUTATION,
        { input: { name: name.trim(), description: description?.trim() || null, schoolId } },
        locals.accessToken!
      );

      if (data.createSubject.errors?.length) {
        return fail(422, { error: data.createSubject.errors.join(', ') });
      }

      return { success: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { error: 'Failed to create subject' });
    }
  }
};
