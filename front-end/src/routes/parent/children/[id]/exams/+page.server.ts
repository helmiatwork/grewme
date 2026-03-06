import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { CLASSROOM_EXAMS_QUERY } from '$lib/api/queries/curriculum';
import type { Student, ClassroomExam, ObjectiveMastery } from '$lib/api/types';

const STUDENT_WITH_CLASSROOMS_QUERY = `
  query Student($id: ID!) {
    student(id: $id) {
      id
      name
      classrooms {
        id
        name
      }
    }
  }
`;

const STUDENT_MASTERIES_QUERY = `
  query StudentMasteries($studentId: ID!) {
    studentMasteries(studentId: $studentId) {
      id
      learningObjective {
        id
        description
        topic { id name subject { id name } }
      }
      examMastered
      dailyMastered
      mastered
      masteredAt
    }
  }
`;

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
  try {
    const [studentData, masteriesData] = await Promise.all([
      graphql<{ student: Student }>(
        STUDENT_WITH_CLASSROOMS_QUERY,
        { id: params.id },
        locals.accessToken!
      ),
      graphql<{ studentMasteries: ObjectiveMastery[] }>(
        STUDENT_MASTERIES_QUERY,
        { studentId: params.id },
        locals.accessToken!
      )
    ]);

    const student = studentData.student;

    // Load classroom exams for each classroom
    const classroomExamsResults = await Promise.all(
      (student.classrooms ?? []).map(async (classroom) => {
        try {
          const data = await graphql<{ classroomExams: ClassroomExam[] }>(
            CLASSROOM_EXAMS_QUERY,
            { classroomId: classroom.id },
            locals.accessToken!
          );
          return data.classroomExams;
        } catch {
          return [];
        }
      })
    );

    const allClassroomExams = classroomExamsResults.flat();

    // Filter submissions to only this student
    const examResults = allClassroomExams.flatMap((ce) =>
      (ce.examSubmissions ?? [])
        .filter((sub) => sub.student.id === params.id)
        .map((sub) => ({
          ...sub,
          exam: ce.exam,
          classroom: ce.classroom
        }))
    );

    return {
      child: student,
      masteries: masteriesData.studentMasteries,
      examResults
    };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
