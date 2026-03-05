import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { FEED_POSTS_QUERY } from '$lib/api/queries/feed';
import { clearAuthCookies } from '$lib/api/auth';
import type { Connection, FeedPost } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const data = await graphql<{ feedPosts: Connection<FeedPost> }>(
      FEED_POSTS_QUERY, { first: 20 }, locals.accessToken!
    );
    return { feedPosts: data.feedPosts.nodes };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};
