import { graphql } from '$lib/api/client';
import {
  CONSENT_STATUS_QUERY,
  EXPORT_CHILD_DATA_MUTATION,
  REQUEST_ACCOUNT_DELETION_MUTATION,
  REVOKE_CONSENT_MUTATION
} from '$lib/api/queries/data-rights';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('access_token');
  if (!token) return { consents: [] };

  try {
    const result = await graphql<any>(CONSENT_STATUS_QUERY, {}, token);
    return { consents: result.consentStatus ?? [] };
  } catch {
    return { consents: [] };
  }
};

export const actions: Actions = {
  exportData: async ({ request, cookies }) => {
    const token = cookies.get('access_token');
    const data = await request.formData();
    const studentId = data.get('studentId') as string;

    try {
      const result = await graphql<any>(EXPORT_CHILD_DATA_MUTATION, { studentId }, token);
      if (result.exportChildData.errors?.length > 0) {
        return { error: result.exportChildData.errors[0].message };
      }
      return { exportData: result.exportChildData.data };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },

  deleteAccount: async ({ request, cookies }) => {
    const token = cookies.get('access_token');
    const data = await request.formData();
    const reason = data.get('reason') as string;

    try {
      const result = await graphql<any>(REQUEST_ACCOUNT_DELETION_MUTATION, { reason: reason || null }, token);
      if (result.requestAccountDeletion.errors?.length > 0) {
        return { error: result.requestAccountDeletion.errors[0].message };
      }
      return { success: 'Account deletion requested. You have 30 days to cancel.' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },

  revokeConsent: async ({ request, cookies }) => {
    const token = cookies.get('access_token');
    const data = await request.formData();
    const consentId = data.get('consentId') as string;

    try {
      const result = await graphql<any>(REVOKE_CONSENT_MUTATION, { input: { id: consentId } }, token);
      if (result.revokeConsent.errors?.length > 0) {
        return { error: result.revokeConsent.errors[0].message };
      }
      return { success: 'Consent revoked successfully.' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
};
