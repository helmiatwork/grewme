import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { ACADEMIC_YEARS_QUERY, GRADE_CURRICULUM_QUERY } from '$lib/api/queries/yearly-curriculum';
import type { Classroom, AcademicYear, GradeCurriculum } from '$lib/api/types';

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

const SUBJECTS_WITH_EXAMS_QUERY = `
  query SubjectsWithExams($schoolId: ID!) {
    subjects(schoolId: $schoolId) {
      id
      name
      topics {
        id
        name
        exams {
          id
          title
          examType
          maxScore
          durationMinutes
          classroomExams { id }
        }
      }
    }
  }
`;

interface ExamListItem {
  id: string;
  title: string;
  examType: string;
  maxScore: number | null;
  durationMinutes: number | null;
  topicName: string;
  subjectName: string;
  subjectId: string;
  classroomCount: number;
}

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  try {
    const token = locals.accessToken!;

    const classroomsData = await graphql<{
      classrooms: Array<{ id: string; name: string; grade: number | null; school: { id: string; name: string; minGrade: number; maxGrade: number } }>;
    }>(CLASSROOMS_WITH_GRADE_QUERY, {}, token);

    const classrooms = classroomsData.classrooms;
    const school = classrooms[0]?.school;

    if (!school) {
      return { exams: [], classrooms: [], schoolId: null, teacherGrades: [], selectedGrade: null, gradeCurriculum: null };
    }

    const teacherGrades = [...new Set(classrooms.map(c => c.grade).filter((g): g is number => g !== null))].sort((a, b) => a - b);

    const [subjectsData, yearsData] = await Promise.all([
      graphql<{
        subjects: Array<{
          id: string;
          name: string;
          topics: Array<{
            id: string;
            name: string;
            exams: Array<{
              id: string;
              title: string;
              examType: string;
              maxScore: number | null;
              durationMinutes: number | null;
              classroomExams: Array<{ id: string }>;
            }>;
          }>;
        }>;
      }>(SUBJECTS_WITH_EXAMS_QUERY, { schoolId: school.id }, token),
      graphql<{ academicYears: AcademicYear[] }>(ACADEMIC_YEARS_QUERY, { schoolId: school.id }, token)
    ]);

    const currentYear = yearsData.academicYears.find(y => y.current) ?? yearsData.academicYears[0] ?? null;
    const selectedGrade = url.searchParams.get('grade') ? Number(url.searchParams.get('grade')) : null;

    let gradeCurriculum: GradeCurriculum | null = null;
    if (selectedGrade && currentYear) {
      const gcData = await graphql<{ gradeCurriculum: GradeCurriculum | null }>(
        GRADE_CURRICULUM_QUERY,
        { academicYearId: currentYear.id, grade: selectedGrade },
        token
      );
      gradeCurriculum = gcData.gradeCurriculum;
    }

    const exams: ExamListItem[] = [];
    for (const subject of subjectsData.subjects) {
      for (const topic of subject.topics) {
        for (const exam of topic.exams) {
          exams.push({
            id: exam.id,
            title: exam.title,
            examType: exam.examType,
            maxScore: exam.maxScore,
            durationMinutes: exam.durationMinutes,
            topicName: topic.name,
            subjectName: subject.name,
            subjectId: subject.id,
            classroomCount: exam.classroomExams.length
          });
        }
      }
    }

    return { exams, classrooms, schoolId: school.id, teacherGrades, selectedGrade, gradeCurriculum };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
