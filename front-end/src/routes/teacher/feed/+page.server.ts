import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import { FEED_POSTS_QUERY } from '$lib/api/queries/feed';
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
