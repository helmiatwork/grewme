import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { MY_CHILDREN_QUERY } from '$lib/api/queries/parents';
import { STUDENT_RADAR_QUERY } from '$lib/api/queries/students';
import { FEED_POSTS_QUERY } from '$lib/api/queries/feed';
import type { Student, RadarData, RadarSkills, FeedPost, Connection } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals }) => {
  const childrenData = await graphql<{ myChildren: Student[] }>(
    MY_CHILDREN_QUERY,
    {},
    locals.accessToken!
  );

  // Load radar data for each child
  const childrenWithRadar = await Promise.all(
    childrenData.myChildren.map(async (child) => {
      try {
        const radarData = await graphql<{ studentRadar: RadarData }>(
          STUDENT_RADAR_QUERY,
          { studentId: child.id },
          locals.accessToken!
        );
        return { ...child, radar: radarData.studentRadar.skills };
      } catch {
        return { ...child, radar: null as RadarSkills | null };
      }
    })
  );

  // Load feed posts
  let feedPosts: FeedPost[] = [];
  try {
    const feedData = await graphql<{ feedPosts: Connection<FeedPost> }>(
      FEED_POSTS_QUERY,
      { first: 20 },
      locals.accessToken!
    );
    feedPosts = feedData.feedPosts.nodes;
  } catch {
    // Feed is non-critical, don't fail the page
  }

  return { children: childrenWithRadar, feedPosts };
};
