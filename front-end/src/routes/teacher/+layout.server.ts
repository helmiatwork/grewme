import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.type !== 'Teacher') {
    throw redirect(303, '/login');
  }
  return {
    user: locals.user,
    accessToken: locals.accessToken,
    cableUrl: env.RAILS_CABLE_URL || 'ws://localhost:3004/cable',
  };
};
