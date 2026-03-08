import { graphql } from '$lib/api/client';
import { GRANT_CONSENT_MUTATION, DECLINE_CONSENT_MUTATION } from '$lib/api/queries/consent';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  grant: async ({ request, params, cookies }) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    const password = data.get('password') as string;
    const passwordConfirmation = data.get('passwordConfirmation') as string;

    try {
      const result = await graphql<any>(GRANT_CONSENT_MUTATION, {
        input: { token: params.token, name, password, passwordConfirmation }
      });

      if (result.grantConsent.errors?.length > 0) {
        return { error: result.grantConsent.errors[0].message };
      }

      cookies.set('access_token', result.grantConsent.accessToken, {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });

      throw redirect(303, '/parent/dashboard');
    } catch (e) {
      if (e instanceof Response) throw e;
      return { error: (e as Error).message };
    }
  },

  decline: async ({ params }) => {
    try {
      const result = await graphql<any>(DECLINE_CONSENT_MUTATION, {
        input: { token: params.token }
      });

      if (result.declineConsent.errors?.length > 0) {
        return { error: result.declineConsent.errors[0].message };
      }

      return { declined: true };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
};
