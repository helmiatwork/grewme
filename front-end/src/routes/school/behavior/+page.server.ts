import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { BEHAVIOR_CATEGORIES_QUERY } from '$lib/api/queries/behavior';

const ME_QUERY = `
  query {
    me {
      ... on SchoolManager {
        id
        school {
          id
          name
          classrooms {
            id
            name
            students { id }
            teacher { id name }
          }
        }
      }
    }
  }
`;

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const meData = await graphql<{
      me: {
        school: {
          id: string;
          name: string;
          classrooms: Array<{
            id: string;
            name: string;
            students: Array<{ id: string }>;
            teacher: { id: string; name: string } | null;
          }>;
        };
      };
    }>(ME_QUERY, {}, locals.accessToken!);

    const school = meData?.me?.school;
    if (!school) return { schoolId: null, classrooms: [], categories: [] };

    const categoriesData = await graphql<{ behaviorCategories: any[] }>(
      BEHAVIOR_CATEGORIES_QUERY,
      { schoolId: school.id },
      locals.accessToken!
    );

    return {
      schoolId: school.id,
      classrooms: school.classrooms ?? [],
      categories: categoriesData.behaviorCategories ?? []
    };
  } catch {
    return { schoolId: null, classrooms: [], categories: [] };
  }
};
