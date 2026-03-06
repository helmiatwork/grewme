import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import type { Classroom } from '$lib/api/types';

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
      return { exams: [], classrooms, schoolId: null };
    }

    const subjectsData = await graphql<{
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
    }>(SUBJECTS_WITH_EXAMS_QUERY, { schoolId }, token);

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

    return { exams, classrooms, schoolId };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
