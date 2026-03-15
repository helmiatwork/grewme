import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { BEHAVIOR_CATEGORIES_QUERY } from '$lib/api/queries/behavior';

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

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const meData = await graphql<{ me: { school: { id: string; name: string } } }>(
      ME_QUERY,
      {},
      locals.accessToken!
    );
    const schoolId = meData?.me?.school?.id ?? null;

    if (!schoolId) {
      return { categories: [], schoolId: null };
    }

    const categoriesData = await graphql<{ behaviorCategories: any[] }>(
      BEHAVIOR_CATEGORIES_QUERY,
      { schoolId },
      locals.accessToken!
    );

    return {
      categories: categoriesData.behaviorCategories ?? [],
      schoolId
    };
  } catch {
    return { categories: [], schoolId: null };
  }
};
