import { graphql } from '$lib/api/client';
import {
  STUDENT_HEALTH_CHECKUPS_QUERY,
  CREATE_HEALTH_CHECKUP_MUTATION
} from '$lib/api/queries/health-checkups';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('access_token');
  if (!token) return { checkups: [], studentId: params.id };

  try {
    const result = await graphql<any>(STUDENT_HEALTH_CHECKUPS_QUERY, {
      studentId: params.id
    }, token);
    return {
      checkups: result.studentHealthCheckups ?? [],
      studentId: params.id
    };
  } catch {
    return { checkups: [], studentId: params.id };
  }
};

export const actions: Actions = {
  create: async ({ request, cookies, params }) => {
    const token = cookies.get('access_token');
    const data = await request.formData();

    const variables: Record<string, any> = {
      studentId: params.id,
      measuredAt: data.get('measuredAt') as string
    };

    const weightKg = data.get('weightKg');
    if (weightKg && weightKg !== '') variables.weightKg = parseFloat(weightKg as string);

    const heightCm = data.get('heightCm');
    if (heightCm && heightCm !== '') variables.heightCm = parseFloat(heightCm as string);

    const headCircumferenceCm = data.get('headCircumferenceCm');
    if (headCircumferenceCm && headCircumferenceCm !== '') variables.headCircumferenceCm = parseFloat(headCircumferenceCm as string);

    const notes = data.get('notes');
    if (notes && notes !== '') variables.notes = notes as string;

    try {
      const result = await graphql<any>(CREATE_HEALTH_CHECKUP_MUTATION, variables, token);
      if (result.createHealthCheckup.errors?.length > 0) {
        return { error: result.createHealthCheckup.errors[0].message };
      }
      return { success: 'Health checkup recorded successfully.' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
};
