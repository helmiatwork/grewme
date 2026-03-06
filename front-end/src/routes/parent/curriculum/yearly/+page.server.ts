import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { ACADEMIC_YEARS_QUERY, GRADE_CURRICULUM_QUERY } from '$lib/api/queries/yearly-curriculum';
import type { Student, AcademicYear, GradeCurriculum } from '$lib/api/types';

const MY_CHILDREN_QUERY = `
  query {
    myChildren {
      id
      name
      classrooms {
        id
        name
        grade
        school { id name minGrade maxGrade }
      }
    }
  }
`;

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  try {
    const childrenData = await graphql<{
      myChildren: (Student & { classrooms: { id: string; name: string; grade: number | null; school: { id: string; name: string; minGrade: number; maxGrade: number } }[] })[];
    }>(MY_CHILDREN_QUERY, {}, locals.accessToken!);

    const children = childrenData.myChildren;
    const school = children[0]?.classrooms?.[0]?.school;

    if (!school) {
      return { academicYears: [], school: null, gradeCurriculum: null, selectedYearId: null, selectedGrade: null, childGrades: [], children: [] };
    }

    // Get unique grades from children's classrooms
    const childGrades = [...new Set(
      children.flatMap(c => c.classrooms?.map(cl => cl.grade).filter((g): g is number => g !== null) ?? [])
    )].sort((a, b) => a - b);

    const yearsData = await graphql<{ academicYears: AcademicYear[] }>(
      ACADEMIC_YEARS_QUERY,
      { schoolId: school.id },
      locals.accessToken!
    );

    const selectedYearId = url.searchParams.get('yearId') || yearsData.academicYears.find(y => y.current)?.id || yearsData.academicYears[0]?.id || null;
    const selectedGrade = Number(url.searchParams.get('grade')) || childGrades[0] || school.minGrade;

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
      academicYears: yearsData.academicYears,
      school,
      gradeCurriculum,
      selectedYearId,
      selectedGrade,
      childGrades,
      children
    };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
