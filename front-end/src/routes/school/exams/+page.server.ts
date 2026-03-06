import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { SUBJECTS_QUERY } from '$lib/api/queries/curriculum';
import { SCHOOL_CLASSROOMS_QUERY } from '$lib/api/queries/school';
import type { Subject } from '$lib/api/types';

const ME_QUERY = `
  query {
    me {
      ... on SchoolManager {
        id
        school { id name }
      }
    }
  }
`;

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const meData = await graphql<{ me: { id: string; school: { id: string; name: string } } }>(
      ME_QUERY,
      {},
      locals.accessToken!
    );

    const schoolId = meData.me?.school?.id;

    if (!schoolId) {
      return { subjects: [], exams: [], classrooms: [] };
    }

    const [subjectsData, classroomsData] = await Promise.all([
      graphql<{ subjects: Subject[] }>(
        SUBJECTS_QUERY,
        { schoolId },
        locals.accessToken!
      ),
      graphql<{ classrooms: Array<{ id: string; name: string }> }>(
        SCHOOL_CLASSROOMS_QUERY,
        {},
        locals.accessToken!
      )
    ]);

    // Collect all exams from all topics across all subjects
    const exams = subjectsData.subjects.flatMap((subject) =>
      subject.topics.flatMap((topic: any) =>
        (topic.exams ?? []).map((exam: any) => ({
          ...exam,
          topic: { id: topic.id, name: topic.name, subject: { id: subject.id, name: subject.name } }
        }))
      )
    );

    return {
      subjects: subjectsData.subjects,
      exams,
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
