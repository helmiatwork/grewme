import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import {
  SUBJECT_QUERY,
  UPDATE_SUBJECT_MUTATION,
  DELETE_SUBJECT_MUTATION,
  CREATE_TOPIC_MUTATION
} from '$lib/api/queries/curriculum';
import type { Subject, Topic } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  try {
    const data = await graphql<{ subject: Subject }>(
      SUBJECT_QUERY,
      { id: params.subjectId },
      locals.accessToken!
    );

    return { subject: data.subject };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};

export const actions: Actions = {
  updateSubject: async ({ request, locals, cookies, params }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name?.trim()) {
      return fail(400, { updateError: 'Subject name is required' });
    }

    try {
      const data = await graphql<{
        updateSubject: { subject: Subject | null; errors: string[] };
      }>(
        UPDATE_SUBJECT_MUTATION,
        { input: { id: params.subjectId, name: name.trim(), description: description?.trim() || null } },
        locals.accessToken!
      );

      if (data.updateSubject.errors?.length) {
        return fail(422, { updateError: data.updateSubject.errors.join(', ') });
      }

      return { updateSuccess: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { updateError: 'Failed to update subject' });
    }
  },

  deleteSubject: async ({ locals, cookies, params }) => {
    try {
      const data = await graphql<{
        deleteSubject: { success: boolean; errors: string[] };
      }>(
        DELETE_SUBJECT_MUTATION,
        { id: params.subjectId },
        locals.accessToken!
      );

      if (!data.deleteSubject.success) {
        return fail(422, { deleteError: data.deleteSubject.errors.join(', ') });
      }

      throw redirect(303, '/teacher/curriculum');
    } catch (err) {
      if (err instanceof redirect) throw err;
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { deleteError: 'Failed to delete subject' });
    }
  },

  createTopic: async ({ request, locals, cookies, params }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name?.trim()) {
      return fail(400, { topicError: 'Topic name is required' });
    }

    try {
      const data = await graphql<{
        createTopic: { topic: Topic | null; errors: string[] };
      }>(
        CREATE_TOPIC_MUTATION,
        { input: { name: name.trim(), description: description?.trim() || null, subjectId: params.subjectId } },
        locals.accessToken!
      );

      if (data.createTopic.errors?.length) {
        return fail(422, { topicError: data.createTopic.errors.join(', ') });
      }

      return { topicSuccess: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { topicError: 'Failed to create topic' });
    }
  }
};
