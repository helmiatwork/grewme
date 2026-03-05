import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { FEED_POST_QUERY } from '$lib/api/queries/feed';
import type { FeedPost } from '$lib/api/types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const data = await graphql<{ feedPost: FeedPost }>(
      FEED_POST_QUERY,
      { id: params.id },
      locals.accessToken ?? undefined
    );
    return { post: data.feedPost };
  } catch {
    error(404, 'Post not found');
  }
};
