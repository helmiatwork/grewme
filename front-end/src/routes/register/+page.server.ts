import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { graphql } from '$lib/api/client';
import { REGISTER_MUTATION, REGISTER_SCHOOL_MANAGER_MUTATION } from '$lib/api/queries/auth';
import { setAuthCookies } from '$lib/api/auth';
import type { AuthPayload } from '$lib/api/types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const passwordConfirmation = formData.get('passwordConfirmation') as string;
    const role = formData.get('role') as string;
    const phone = formData.get('phone') as string;

    if (!name || !email || !password || !passwordConfirmation || !role) {
      return fail(400, { error: 'All fields are required', name, email, role });
    }

    if (password !== passwordConfirmation) {
      return fail(400, { error: 'Passwords do not match', name, email, role });
    }

    try {
      if (role === 'school_manager') {
        // School manager registration — creates school + manager together
        const schoolName = formData.get('schoolName') as string;
        const minGrade = parseInt(formData.get('minGrade') as string, 10);
        const maxGrade = parseInt(formData.get('maxGrade') as string, 10);
        const addressLine1 = formData.get('addressLine1') as string;
        const city = formData.get('city') as string;
        const stateProvince = formData.get('stateProvince') as string;
        const postalCode = formData.get('postalCode') as string;
        const countryCode = formData.get('countryCode') as string;

        if (!schoolName || !addressLine1 || !city || !stateProvince || !postalCode || !countryCode) {
          return fail(400, { error: 'All school fields are required', name, email, role });
        }

        const data = await graphql<{ registerSchoolManager: AuthPayload & { school: { id: string; name: string } } }>(
          REGISTER_SCHOOL_MANAGER_MUTATION,
          { name, email, password, passwordConfirmation, schoolName, minGrade, maxGrade, addressLine1, city, stateProvince, postalCode, countryCode }
        );

        const result = data.registerSchoolManager;
        if (result.errors.length > 0) {
          return fail(422, { error: result.errors.map((e) => e.message).join(', '), name, email, role });
        }

        if (result.accessToken && result.refreshToken && result.expiresIn) {
          setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, role);
        }

        throw redirect(303, '/school/onboarding');
      }

      // Teacher/Parent registration (existing flow)
      const data = await graphql<{ register: AuthPayload }>(REGISTER_MUTATION, {
        input: { name, email, password, passwordConfirmation, role, phone: phone || null }
      });

      const result = data.register;

      if (result.errors.length > 0) {
        return fail(422, {
          error: result.errors.map((e) => e.message).join(', '),
          name,
          email,
          role
        });
      }

      if (result.accessToken && result.refreshToken && result.expiresIn) {
        setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, role);
      }
    } catch (err) {
      // Re-throw SvelteKit redirects
      if ((err as any)?.status === 303 || (err as any)?.location) throw err;
      return fail(500, { error: 'Something went wrong. Please try again.', name, email, role });
    }

    const dashboard = role === 'teacher' ? '/teacher/dashboard' : '/parent/dashboard';
    throw redirect(303, dashboard);
  }
};
