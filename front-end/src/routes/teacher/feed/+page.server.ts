import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import { FEED_POSTS_QUERY, CREATE_FEED_POST_MUTATION } from '$lib/api/queries/feed';
import type { Classroom, FeedPost, Connection } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals }) => {
  const [classroomsData, feedData] = await Promise.all([
    graphql<{ classrooms: Classroom[] }>(CLASSROOMS_QUERY, {}, locals.accessToken!),
    graphql<{ feedPosts: Connection<FeedPost> }>(FEED_POSTS_QUERY, { first: 20 }, locals.accessToken!)
  ]);

  return {
    classrooms: classroomsData.classrooms,
    feedPosts: feedData.feedPosts.nodes
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const classroomId = formData.get('classroomId') as string;
    const body = formData.get('body') as string;

    if (!classroomId || !body?.trim()) {
      return fail(400, { error: 'Classroom and message are required' });
    }

    try {
      const result = await graphql<{
        createFeedPost: { feedPost: { id: string } | null; errors: { message: string }[] };
      }>(CREATE_FEED_POST_MUTATION, { classroomId, body: body.trim() }, locals.accessToken!);

      if (result.createFeedPost.errors.length > 0) {
        return fail(400, { error: result.createFeedPost.errors[0].message });
      }
    } catch {
      return fail(500, { error: 'Failed to create post' });
    }

    redirect(303, '/teacher/feed');
  }
};
