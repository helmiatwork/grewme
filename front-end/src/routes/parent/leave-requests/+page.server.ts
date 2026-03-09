import { graphql } from '$lib/api/client';
import {
  PARENT_LEAVE_REQUESTS_QUERY,
  CREATE_LEAVE_REQUEST_MUTATION,
  DELETE_LEAVE_REQUEST_MUTATION
} from '$lib/api/queries/attendance';
import type { PageServerLoad, Actions } from './$types';

const MY_CHILDREN_QUERY = `
  query {
    myChildren {
      id
      name
    }
  }
`;

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.accessToken;
  if (!token) return { leaveRequests: [], children: [] };

  try {
    const [requestsData, childrenData] = await Promise.all([
      graphql<any>(PARENT_LEAVE_REQUESTS_QUERY, {}, token),
      graphql<any>(MY_CHILDREN_QUERY, {}, token)
    ]);

    return {
      leaveRequests: requestsData.parentLeaveRequests ?? [],
      children: childrenData.myChildren ?? []
    };
  } catch {
    return { leaveRequests: [], children: [] };
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const token = locals.accessToken;
    if (!token) return { error: 'Unauthorized' };

    const data = await request.formData();

    try {
      const result = await graphql<any>(
        CREATE_LEAVE_REQUEST_MUTATION,
        {
          studentId: data.get('studentId') as string,
          requestType: data.get('requestType') as string,
          startDate: data.get('startDate') as string,
          endDate: data.get('endDate') as string,
          reason: data.get('reason') as string
        },
        token
      );

      if (result.createLeaveRequest.errors?.length > 0) {
        return { error: result.createLeaveRequest.errors[0].message };
      }

      return { success: 'Leave request submitted successfully' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },

  delete: async ({ request, locals }) => {
    const token = locals.accessToken;
    if (!token) return { error: 'Unauthorized' };

    const data = await request.formData();

    try {
      const result = await graphql<any>(
        DELETE_LEAVE_REQUEST_MUTATION,
        {
          leaveRequestId: data.get('leaveRequestId') as string
        },
        token
      );

      if (!result.deleteLeaveRequest.success) {
        return { error: result.deleteLeaveRequest.errors[0]?.message ?? 'Failed to delete' };
      }

      return { success: 'Leave request deleted' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
};
