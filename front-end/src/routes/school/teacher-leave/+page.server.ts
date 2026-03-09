import { graphql } from '$lib/api/client';
import {
  SCHOOL_TEACHER_LEAVE_REQUESTS_QUERY,
  SCHOOL_TEACHERS_QUERY,
  REVIEW_TEACHER_LEAVE_REQUEST_MUTATION
} from '$lib/api/queries/teacher-leave';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.accessToken;
  if (!token) return { leaveRequests: [], teachers: [] };
  try {
    const [requestsData, teachersData] = await Promise.all([
      graphql<any>(SCHOOL_TEACHER_LEAVE_REQUESTS_QUERY, {}, token),
      graphql<any>(SCHOOL_TEACHERS_QUERY, {}, token)
    ]);
    return {
      leaveRequests: requestsData.schoolTeacherLeaveRequests ?? [],
      teachers: teachersData.schoolTeachers ?? []
    };
  } catch {
    return { leaveRequests: [], teachers: [] };
  }
};

export const actions: Actions = {
  review: async ({ request, locals }) => {
    const token = locals.accessToken;
    const formData = await request.formData();
    const teacherLeaveRequestId = formData.get('teacherLeaveRequestId') as string;
    const decision = formData.get('decision') as string;
    const rejectionReason = formData.get('rejectionReason') as string | null;
    const substituteId = formData.get('substituteId') as string | null;

    try {
      const result = await graphql<any>(
        REVIEW_TEACHER_LEAVE_REQUEST_MUTATION,
        {
          teacherLeaveRequestId,
          decision,
          rejectionReason: rejectionReason || null,
          substituteId: substituteId || null
        },
        token
      );
      if (result.reviewTeacherLeaveRequest.errors?.length > 0) {
        return fail(422, { error: result.reviewTeacherLeaveRequest.errors[0].message });
      }
      return { success: `Leave request ${decision.toLowerCase()}` };
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
  }
};
