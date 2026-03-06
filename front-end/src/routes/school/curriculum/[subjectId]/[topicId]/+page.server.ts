import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import {
  TOPIC_QUERY,
  UPDATE_TOPIC_MUTATION,
  DELETE_TOPIC_MUTATION,
  CREATE_LEARNING_OBJECTIVE_MUTATION,
  UPDATE_LEARNING_OBJECTIVE_MUTATION,
  DELETE_LEARNING_OBJECTIVE_MUTATION
} from '$lib/api/queries/curriculum';
import type { Topic, LearningObjective } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  try {
    const data = await graphql<{ topic: Topic }>(
      TOPIC_QUERY,
      { id: params.topicId },
      locals.accessToken!
    );

    return { topic: data.topic };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};

export const actions: Actions = {
  updateTopic: async ({ request, locals, cookies, params }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name?.trim()) {
      return fail(400, { updateError: 'Topic name is required' });
    }

    try {
      const data = await graphql<{
        updateTopic: { topic: Topic | null; errors: string[] };
      }>(
        UPDATE_TOPIC_MUTATION,
        { input: { id: params.topicId, name: name.trim(), description: description?.trim() || null } },
        locals.accessToken!
      );

      if (data.updateTopic.errors?.length) {
        return fail(422, { updateError: data.updateTopic.errors.join(', ') });
      }

      return { updateSuccess: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { updateError: 'Failed to update topic' });
    }
  },

  deleteTopic: async ({ locals, cookies, params }) => {
    try {
      const data = await graphql<{
        deleteTopic: { success: boolean; errors: string[] };
      }>(
        DELETE_TOPIC_MUTATION,
        { id: params.topicId },
        locals.accessToken!
      );

      if (!data.deleteTopic.success) {
        return fail(422, { deleteError: data.deleteTopic.errors.join(', ') });
      }

      throw redirect(303, `/school/curriculum/${params.subjectId}`);
    } catch (err) {
      if (err instanceof redirect) throw err;
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { deleteError: 'Failed to delete topic' });
    }
  },

  createLO: async ({ request, locals, cookies, params }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const examPassThreshold = formData.get('examPassThreshold') as string;
    const dailyScoreThreshold = formData.get('dailyScoreThreshold') as string;

    if (!name?.trim()) {
      return fail(400, { loError: 'Name is required' });
    }

    if (!description?.trim()) {
      return fail(400, { loError: 'Description is required' });
    }

    try {
      const data = await graphql<{
        createLearningObjective: { learningObjective: LearningObjective | null; errors: string[] };
      }>(
        CREATE_LEARNING_OBJECTIVE_MUTATION,
        {
          input: {
            name: name.trim(),
            description: description.trim(),
            topicId: params.topicId,
            examPassThreshold: examPassThreshold ? parseInt(examPassThreshold, 10) : undefined,
            dailyScoreThreshold: dailyScoreThreshold ? parseInt(dailyScoreThreshold, 10) : undefined
          }
        },
        locals.accessToken!
      );

      if (data.createLearningObjective.errors?.length) {
        return fail(422, { loError: data.createLearningObjective.errors.join(', ') });
      }

      return { loSuccess: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { loError: 'Failed to create learning objective' });
    }
  },

  updateLO: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const examPassThreshold = formData.get('examPassThreshold') as string;
    const dailyScoreThreshold = formData.get('dailyScoreThreshold') as string;

    if (!description?.trim()) {
      return fail(400, { loUpdateError: 'Description is required' });
    }

    try {
      const data = await graphql<{
        updateLearningObjective: { learningObjective: LearningObjective | null; errors: string[] };
      }>(
        UPDATE_LEARNING_OBJECTIVE_MUTATION,
        {
          input: {
            id,
            name: name?.trim() || undefined,
            description: description.trim(),
            examPassThreshold: examPassThreshold ? parseInt(examPassThreshold, 10) : undefined,
            dailyScoreThreshold: dailyScoreThreshold ? parseInt(dailyScoreThreshold, 10) : undefined
          }
        },
        locals.accessToken!
      );

      if (data.updateLearningObjective.errors?.length) {
        return fail(422, { loUpdateError: data.updateLearningObjective.errors.join(', ') });
      }

      return { loUpdateSuccess: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { loUpdateError: 'Failed to update learning objective' });
    }
  },

  deleteLO: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;

    try {
      const data = await graphql<{
        deleteLearningObjective: { success: boolean; errors: string[] };
      }>(
        DELETE_LEARNING_OBJECTIVE_MUTATION,
        { id },
        locals.accessToken!
      );

      if (!data.deleteLearningObjective.success) {
        return fail(422, { loDeleteError: data.deleteLearningObjective.errors.join(', ') });
      }

      return { loDeleteSuccess: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { loDeleteError: 'Failed to delete learning objective' });
    }
  }
};
