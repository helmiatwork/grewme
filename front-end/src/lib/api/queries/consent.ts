export const GRANT_CONSENT_MUTATION = `
  mutation GrantConsent($input: GrantConsentInput!) {
    grantConsent(input: $input) {
      accessToken
      user { ... on Parent { id name role } }
      consent { id status }
      errors { message path }
    }
  }
`;

export const DECLINE_CONSENT_MUTATION = `
  mutation DeclineConsent($input: DeclineConsentInput!) {
    declineConsent(input: $input) {
      consent { id status }
      errors { message path }
    }
  }
`;
