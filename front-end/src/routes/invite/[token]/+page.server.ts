import { graphql } from '$lib/api/client';
import { ACCEPT_INVITATION_MUTATION } from '$lib/api/queries/invitations';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, params, cookies }) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    const password = data.get('password') as string;
    const passwordConfirmation = data.get('passwordConfirmation') as string;

    try {
      const result = await graphql<any>(ACCEPT_INVITATION_MUTATION, {
        input: { token: params.token, name, password, passwordConfirmation }
      });

      if (result.acceptInvitation.errors?.length > 0) {
        return { error: result.acceptInvitation.errors[0].message };
      }

      // Set auth cookie and redirect
      cookies.set('access_token', result.acceptInvitation.accessToken, {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });

      throw redirect(303, '/teacher/dashboard');
    } catch (e) {
      if (e instanceof Response) throw e; // re-throw redirects
      return { error: (e as Error).message };
    }
  }
};
