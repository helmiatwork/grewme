import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { graphql } from '$lib/api/client';
import { REGISTER_MUTATION } from '$lib/api/queries/auth';
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
    } catch {
      return fail(500, { error: 'Something went wrong. Please try again.', name, email, role });
    }

    const dashboard = role === 'teacher' ? '/teacher/dashboard' : '/parent/dashboard';
    throw redirect(303, dashboard);
  }
};
