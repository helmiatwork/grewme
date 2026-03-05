import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { graphql } from '$lib/api/client';
import { LOGIN_MUTATION } from '$lib/api/queries/auth';
import { setAuthCookies } from '$lib/api/auth';
import type { AuthPayload } from '$lib/api/types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    if (!email || !password || !role) {
      return fail(400, { error: 'All fields are required', email, role });
    }

    try {
      const data = await graphql<{ login: AuthPayload }>(LOGIN_MUTATION, {
        email,
        password,
        role
      });

      const result = data.login;

      if (result.errors.length > 0) {
        return fail(401, {
          error: result.errors[0].message,
          email,
          role
        });
      }

      if (result.accessToken && result.refreshToken && result.expiresIn) {
        setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, role);
      }
    } catch {
      return fail(500, { error: 'Something went wrong. Please try again.', email, role });
    }

    const dashboard = role === 'teacher'
      ? '/teacher/dashboard'
      : role === 'school_manager'
        ? '/school/dashboard'
        : '/parent/dashboard';
    throw redirect(303, dashboard);
  }
};
