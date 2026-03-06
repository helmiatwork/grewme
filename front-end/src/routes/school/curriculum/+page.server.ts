import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import { SUBJECTS_QUERY, CREATE_SUBJECT_MUTATION } from '$lib/api/queries/curriculum';
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
      return { subjects: [], schoolId: null };
    }

    const data = await graphql<{ subjects: Subject[] }>(
      SUBJECTS_QUERY,
      { schoolId },
      locals.accessToken!
    );

    return {
      subjects: data.subjects,
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
