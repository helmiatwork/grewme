import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { graphql, GraphQLError } from '$lib/api/client';
import { clearAuthCookies } from '$lib/api/auth';
import {
  SCHOOL_ONBOARDING_STATUS_QUERY,
  UPDATE_SCHOOL_PROFILE_MUTATION,
  COMPLETE_ONBOARDING_MUTATION
} from '$lib/api/queries/onboarding';
import {
  CREATE_ACADEMIC_YEAR_MUTATION
} from '$lib/api/queries/yearly-curriculum';

const ONBOARDING_DATA_QUERY = `
  query {
    schoolOnboardingStatus {
      profileComplete
      academicYearComplete
      subjectsComplete
      classroomsComplete
      teachersInvited
      leaveSettingsConfigured
    }
    me {
      ... on SchoolManager {
        id
        school {
          id
          name
          phone
          email
          website
          minGrade
          maxGrade
          academicYears {
            id
            label
            startDate
            endDate
            current
          }
        }
      }
    }
    schoolTeachers {
      id
      name
    }
    schoolInvitations {
      id
      email
      status
      createdAt
    }
  }
`;

export const load: PageServerLoad = async ({ locals, cookies }) => {
  try {
    const data = await graphql<any>(ONBOARDING_DATA_QUERY, {}, locals.accessToken!);
    const school = data.me?.school;
    if (!school) throw redirect(303, '/school/dashboard');

    // Fetch subjects separately with actual school ID
    let subjects: any[] = [];
    try {
      const subjectsData = await graphql<any>(
        `query Subjects($schoolId: ID!) { subjects(schoolId: $schoolId) { id name } }`,
        { schoolId: school.id },
        locals.accessToken!
      );
      subjects = subjectsData.subjects ?? [];
    } catch {
      /* ignore */
    }

    // Fetch classrooms
    let classrooms: any[] = [];
    try {
      const classroomsData = await graphql<any>(
        `query { classrooms { id name } }`,
        {},
        locals.accessToken!
      );
      classrooms = classroomsData.classrooms ?? [];
    } catch {
      /* ignore */
    }

    return {
      onboardingStatus: data.schoolOnboardingStatus,
      school,
      subjects,
      classrooms,
      teachers: data.schoolTeachers ?? [],
      invitations: data.schoolInvitations ?? []
    };
  } catch (err) {
    if (err instanceof GraphQLError && err.message.toLowerCase().includes('authentication')) {
      clearAuthCookies(cookies);
      throw redirect(303, '/login?force');
    }
    throw err;
  }
};

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    const formData = await request.formData();
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const website = formData.get('website') as string;

    try {
      const result = await graphql<any>(
        UPDATE_SCHOOL_PROFILE_MUTATION,
        { phone: phone || null, email: email || null, website: website || null },
        locals.accessToken!
      );
      if (result.updateSchoolProfile.errors?.length > 0) {
        return fail(422, { error: result.updateSchoolProfile.errors[0].message });
      }
      return { success: true, step: 'profile' };
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
  },

  createAcademicYear: async ({ request, locals }) => {
    const formData = await request.formData();
    const schoolId = formData.get('schoolId') as string;
    const label = formData.get('label') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    try {
      const result = await graphql<any>(
        CREATE_ACADEMIC_YEAR_MUTATION,
        { input: { schoolId, label, startDate, endDate, current: true } },
        locals.accessToken!
      );
      if (result.createAcademicYear.errors?.length > 0) {
        return fail(422, { error: result.createAcademicYear.errors[0].message });
      }
      return { success: true, step: 'academicYear' };
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
  },

  createSubject: async ({ request, locals }) => {
    const formData = await request.formData();
    const schoolId = formData.get('schoolId') as string;
    const name = formData.get('subjectName') as string;

    try {
      const result = await graphql<any>(
        `mutation CreateSubject($input: CreateSubjectInput!) { createSubject(input: $input) { subject { id name } errors { message path } } }`,
        { input: { schoolId, name } },
        locals.accessToken!
      );
      if (result.createSubject.errors?.length > 0) {
        return fail(422, { error: result.createSubject.errors[0].message });
      }
      return { success: true, step: 'subject' };
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
  },

  createInvitation: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get('teacherEmail') as string;

    try {
      const result = await graphql<any>(
        `mutation CreateInvitation($email: String!, $role: String!) { createInvitation(email: $email, role: $role) { invitation { id email } errors { message path } } }`,
        { email, role: 'teacher' },
        locals.accessToken!
      );
      if (result.createInvitation.errors?.length > 0) {
        return fail(422, { error: result.createInvitation.errors[0].message });
      }
      return { success: true, step: 'invitation' };
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
  },

  updateLeaveSettings: async ({ request, locals }) => {
    const formData = await request.formData();
    const maxAnnualLeaveDays = parseInt(formData.get('maxAnnualLeaveDays') as string, 10);
    const maxSickLeaveDays = parseInt(formData.get('maxSickLeaveDays') as string, 10);

    try {
      const result = await graphql<any>(
        `mutation UpdateSchoolLeaveSettings($maxAnnualLeaveDays: Int!, $maxSickLeaveDays: Int!) {
          updateSchoolLeaveSettings(maxAnnualLeaveDays: $maxAnnualLeaveDays, maxSickLeaveDays: $maxSickLeaveDays) {
            school { id }
            errors { message path }
          }
        }`,
        { maxAnnualLeaveDays, maxSickLeaveDays },
        locals.accessToken!
      );
      if (result.updateSchoolLeaveSettings.errors?.length > 0) {
        return fail(422, { error: result.updateSchoolLeaveSettings.errors[0].message });
      }
      return { success: true, step: 'leave' };
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
  },

  completeOnboarding: async ({ locals }) => {
    try {
      await graphql<any>(COMPLETE_ONBOARDING_MUTATION, {}, locals.accessToken!);
    } catch {
      /* ignore */
    }
    throw redirect(303, '/school/dashboard');
  }
};
