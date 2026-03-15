import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params, locals }) => {
  return {
    classroomId: params.id,
    accessToken: locals.accessToken ?? null,
    cableUrl: env.RAILS_CABLE_URL || 'ws://localhost:3004/cable'
  };
};
