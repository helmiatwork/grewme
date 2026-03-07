export const EXPORT_CHILD_DATA_MUTATION = `
  mutation ExportChildData($studentId: ID!) {
    exportChildData(studentId: $studentId) {
      data
      errors { message path }
    }
  }
`;

export const REQUEST_ACCOUNT_DELETION_MUTATION = `
  mutation RequestAccountDeletion($reason: String) {
    requestAccountDeletion(reason: $reason) {
      deletionRequest { id status gracePeriodEndsAt }
      errors { message path }
    }
  }
`;

export const REQUEST_CHILD_DATA_DELETION_MUTATION = `
  mutation RequestChildDataDeletion($studentId: ID!) {
    requestChildDataDeletion(studentId: $studentId) {
      success
      errors { message path }
    }
  }
`;

export const CONSENT_STATUS_QUERY = `
  query ConsentStatus($studentId: ID) {
    consentStatus(studentId: $studentId) {
      id
      studentName
      parentEmail
      status
      grantedAt
      revokedAt
      expiresAt
    }
  }
`;

export const REVOKE_CONSENT_MUTATION = `
  mutation RevokeConsent($input: RevokeConsentInput!) {
    revokeConsent(input: $input) {
      consent { id status }
      errors { message path }
    }
  }
`;
