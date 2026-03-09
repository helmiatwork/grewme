import { graphql } from '$lib/api/client';
import { LEAVE_REQUESTS_QUERY, REVIEW_LEAVE_REQUEST_MUTATION } from '$lib/api/queries/attendance';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.accessToken;
  if (!token) return { leaveRequests: [] };
  try {
    const data = await graphql<any>(LEAVE_REQUESTS_QUERY, {}, token);
    return { leaveRequests: data.leaveRequests ?? [] };
  } catch {
    return { leaveRequests: [] };
  }
};

export const actions: Actions = {
  review: async ({ request, locals }) => {
    const token = locals.accessToken;
    const formData = await request.formData();
    const leaveRequestId = formData.get('leaveRequestId') as string;
    const decision = formData.get('decision') as string;
    const rejectionReason = formData.get('rejectionReason') as string | null;

    try {
      const result = await graphql<any>(
        REVIEW_LEAVE_REQUEST_MUTATION,
        {
          leaveRequestId,
          decision,
          rejectionReason: rejectionReason || null
        },
        token
      );
      if (result.reviewLeaveRequest.errors?.length > 0) {
        return { error: result.reviewLeaveRequest.errors[0].message };
      }
      return { success: `Leave request ${decision.toLowerCase()}` };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
};
