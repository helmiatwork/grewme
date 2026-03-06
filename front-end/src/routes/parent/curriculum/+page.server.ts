import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { SUBJECTS_QUERY } from '$lib/api/queries/curriculum';
import type { Student, Subject } from '$lib/api/types';

const MY_CHILDREN_WITH_SCHOOL_QUERY = `
  query {
    myChildren {
      id
      name
      classrooms {
        id
        name
        school { id name }
      }
    }
  }
`;

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const childrenData = await graphql<{ myChildren: Student[] }>(
      MY_CHILDREN_WITH_SCHOOL_QUERY,
      {},
      locals.accessToken!
    );

    const children = childrenData.myChildren;
    const schoolId = children[0]?.classrooms?.[0]?.school?.id;

    if (!schoolId) {
      return { subjects: [] };
    }

    const data = await graphql<{ subjects: Subject[] }>(
      SUBJECTS_QUERY,
      { schoolId },
      locals.accessToken!
    );

    return { subjects: data.subjects };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
