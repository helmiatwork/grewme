import { graphql } from '$lib/api/client';
import {
  MY_TEACHER_LEAVE_REQUESTS_QUERY,
  MY_TEACHER_LEAVE_BALANCE_QUERY,
  CREATE_TEACHER_LEAVE_REQUEST_MUTATION,
  DELETE_TEACHER_LEAVE_REQUEST_MUTATION
} from '$lib/api/queries/teacher-leave';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.accessToken;
  if (!token) return { leaveRequests: [], balance: null };
  try {
    const [requestsData, balanceData] = await Promise.all([
      graphql<any>(MY_TEACHER_LEAVE_REQUESTS_QUERY, {}, token),
      graphql<any>(MY_TEACHER_LEAVE_BALANCE_QUERY, {}, token)
    ]);
    return {
      leaveRequests: requestsData.myTeacherLeaveRequests ?? [],
      balance: balanceData.myTeacherLeaveBalance ?? null
    };
  } catch {
    return { leaveRequests: [], balance: null };
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const token = locals.accessToken;
    const formData = await request.formData();
    const requestType = formData.get('requestType') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const reason = formData.get('reason') as string;

    if (!requestType || !startDate || !endDate || !reason?.trim()) {
      return fail(400, { error: 'All fields are required' });
    }

    try {
      const result = await graphql<any>(
        CREATE_TEACHER_LEAVE_REQUEST_MUTATION,
        { requestType, startDate, endDate, reason: reason.trim() },
        token
      );
      if (result.createTeacherLeaveRequest.errors?.length > 0) {
        return fail(422, { error: result.createTeacherLeaveRequest.errors[0].message });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
  },

  delete: async ({ request, locals }) => {
    const token = locals.accessToken;
    const formData = await request.formData();
    const teacherLeaveRequestId = formData.get('teacherLeaveRequestId') as string;

    try {
      const result = await graphql<any>(
        DELETE_TEACHER_LEAVE_REQUEST_MUTATION,
        { teacherLeaveRequestId },
        token
      );
      if (result.deleteTeacherLeaveRequest.errors?.length > 0) {
        return fail(422, { error: result.deleteTeacherLeaveRequest.errors[0].message });
      }
      return { deleted: true };
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
  }
};
