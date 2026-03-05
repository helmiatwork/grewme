import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { graphql, GraphQLError } from '$lib/api/client';
import {
  USER_PERMISSIONS_QUERY,
  GRANT_PERMISSION_MUTATION,
  REVOKE_PERMISSION_MUTATION,
  TOGGLE_PERMISSION_MUTATION,
  DELETE_PERMISSION_MUTATION
} from '$lib/api/queries/permissions';
import type { UserPermissions } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const userId = url.searchParams.get('userId');
  const userType = url.searchParams.get('userType');

  let permissions: UserPermissions | null = null;

  if (userId && userType) {
    try {
      const data = await graphql<{ userPermissions: UserPermissions }>(
        USER_PERMISSIONS_QUERY,
        { userId, userType },
        locals.accessToken!
      );
      permissions = data.userPermissions;
    } catch (err) {
      if (err instanceof GraphQLError) {
        return { permissions: null, error: err.errors[0]?.message ?? 'Unknown error' };
      }
    }
  }

  return { permissions, error: null };
};

export const actions: Actions = {
  grant: async ({ request, locals }) => {
    const formData = await request.formData();
    try {
      await graphql(
        GRANT_PERMISSION_MUTATION,
        {
          userId: formData.get('userId'),
          userType: formData.get('userType'),
          resource: formData.get('resource'),
          action: formData.get('action')
        },
        locals.accessToken!
      );
      return { success: 'Permission granted' };
    } catch {
      return fail(422, { error: 'Failed to grant permission' });
    }
  },
  revoke: async ({ request, locals }) => {
    const formData = await request.formData();
    try {
      await graphql(
        REVOKE_PERMISSION_MUTATION,
        {
          userId: formData.get('userId'),
          userType: formData.get('userType'),
          resource: formData.get('resource'),
          action: formData.get('action')
        },
        locals.accessToken!
      );
      return { success: 'Permission revoked' };
    } catch {
      return fail(422, { error: 'Failed to revoke permission' });
    }
  },
  toggle: async ({ request, locals }) => {
    const formData = await request.formData();
    try {
      await graphql(
        TOGGLE_PERMISSION_MUTATION,
        { id: formData.get('id') },
        locals.accessToken!
      );
      return { success: 'Permission toggled' };
    } catch {
      return fail(422, { error: 'Failed to toggle permission' });
    }
  },
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    try {
      await graphql(
        DELETE_PERMISSION_MUTATION,
        { id: formData.get('id') },
        locals.accessToken!
      );
      return { success: 'Permission deleted' };
    } catch {
      return fail(422, { error: 'Failed to delete permission' });
    }
  }
};
