import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { SCHOOL_OVERVIEW_QUERY, SCHOOL_CLASSROOMS_QUERY } from '$lib/api/queries/school';
import { SCHOOL_ONBOARDING_STATUS_QUERY } from '$lib/api/queries/onboarding';
import { COMPLETE_ONBOARDING_MUTATION } from '$lib/api/queries/onboarding';
import { clearAuthCookies } from '$lib/api/auth';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const [overviewData, classroomsData, onboardingData] = await Promise.all([
      graphql<{ schoolOverview: { schoolName: string; classroomCount: number; studentCount: number; teacherCount: number } }>(
        SCHOOL_OVERVIEW_QUERY, {}, locals.accessToken!
      ),
      graphql<{ classrooms: Array<{ id: string; name: string; studentCount?: number }> }>(
        SCHOOL_CLASSROOMS_QUERY, {}, locals.accessToken!
      ),
      graphql<{ schoolOnboardingStatus: any }>(
        SCHOOL_ONBOARDING_STATUS_QUERY, {}, locals.accessToken!
      ).catch(() => ({ schoolOnboardingStatus: null }))
    ]);

    return {
      overview: overviewData.schoolOverview,
      classrooms: classroomsData.classrooms,
      onboardingStatus: onboardingData.schoolOnboardingStatus
    };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};

export const actions: Actions = {
  dismissOnboarding: async ({ locals }) => {
    try {
      await graphql<any>(COMPLETE_ONBOARDING_MUTATION, {}, locals.accessToken!);
      return { dismissed: true };
    } catch {
      return fail(500, { error: 'Failed to dismiss' });
    }
  }
};
