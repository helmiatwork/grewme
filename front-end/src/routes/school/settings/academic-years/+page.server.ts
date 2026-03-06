import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import {
  ACADEMIC_YEARS_QUERY,
  CREATE_ACADEMIC_YEAR_MUTATION,
  UPDATE_ACADEMIC_YEAR_MUTATION,
  SET_CURRENT_ACADEMIC_YEAR_MUTATION
} from '$lib/api/queries/yearly-curriculum';
import type { AcademicYear } from '$lib/api/types';

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

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const meData = await graphql<{
      me: { id: string; school: { id: string; name: string } };
    }>(ME_QUERY, {}, locals.accessToken!);

    const school = meData.me?.school;
    if (!school) {
      return { academicYears: [], schoolId: null };
    }

    const data = await graphql<{ academicYears: AcademicYear[] }>(
      ACADEMIC_YEARS_QUERY,
      { schoolId: school.id },
      locals.accessToken!
    );

    return {
      academicYears: data.academicYears,
      schoolId: school.id
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
  create: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    const schoolId = formData.get('schoolId') as string;
    const label = formData.get('label') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const current = formData.get('current') === 'true';

    if (!label?.trim() || !startDate || !endDate) {
      return fail(400, { error: 'All fields are required' });
    }

    try {
      const data = await graphql<{
        createAcademicYear: { academicYear: AcademicYear | null; errors: { message: string; path: string[] }[] };
      }>(
        CREATE_ACADEMIC_YEAR_MUTATION,
        { input: { schoolId, label: label.trim(), startDate, endDate, current } },
        locals.accessToken!
      );

      if (data.createAcademicYear.errors?.length) {
        return fail(422, { error: data.createAcademicYear.errors.map(e => e.message).join(', ') });
      }

      return { success: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { error: 'Failed to create academic year' });
    }
  },

  update: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const label = formData.get('label') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    try {
      const data = await graphql<{
        updateAcademicYear: { academicYear: AcademicYear | null; errors: { message: string; path: string[] }[] };
      }>(
        UPDATE_ACADEMIC_YEAR_MUTATION,
        { input: { id, label: label?.trim() || undefined, startDate: startDate || undefined, endDate: endDate || undefined } },
        locals.accessToken!
      );

      if (data.updateAcademicYear.errors?.length) {
        return fail(422, { error: data.updateAcademicYear.errors.map(e => e.message).join(', ') });
      }

      return { success: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { error: 'Failed to update academic year' });
    }
  },

  setCurrent: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;

    try {
      const data = await graphql<{
        setCurrentAcademicYear: { academicYear: AcademicYear | null; errors: { message: string; path: string[] }[] };
      }>(
        SET_CURRENT_ACADEMIC_YEAR_MUTATION,
        { id },
        locals.accessToken!
      );

      if (data.setCurrentAcademicYear.errors?.length) {
        return fail(422, { error: data.setCurrentAcademicYear.errors.map(e => e.message).join(', ') });
      }

      return { success: true };
    } catch (err) {
      if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
        clearAuthCookies(cookies);
        throw redirect(303, '/login?force');
      }
      return fail(500, { error: 'Failed to set current academic year' });
    }
  }
};
