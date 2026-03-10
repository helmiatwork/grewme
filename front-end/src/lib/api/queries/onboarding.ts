// ── Onboarding Queries ───────────────────────────────────────────────────────

export const SCHOOL_ONBOARDING_STATUS_QUERY = `
  query {
    schoolOnboardingStatus {
      profileComplete
      academicYearComplete
      subjectsComplete
      classroomsComplete
      teachersInvited
      leaveSettingsConfigured
    }
  }
`;

export const UPDATE_SCHOOL_PROFILE_MUTATION = `
  mutation UpdateSchoolProfile($phone: String, $email: String, $website: String) {
    updateSchoolProfile(phone: $phone, email: $email, website: $website) {
      school {
        id
        phone
        email
        website
      }
      errors {
        message
        path
      }
    }
  }
`;

export const COMPLETE_ONBOARDING_MUTATION = `
  mutation CompleteOnboarding {
    completeOnboarding {
      school {
        id
        onboardingCompletedAt
      }
      errors {
        message
        path
      }
    }
  }
`;
