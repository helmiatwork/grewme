import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { PROFILE_QUERY } from '$lib/api/queries/profile';
import type { Teacher } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals }) => {
  const data = await graphql<{ me: Teacher }>(PROFILE_QUERY, {}, locals.accessToken!);
  return { profile: data.me };
};
