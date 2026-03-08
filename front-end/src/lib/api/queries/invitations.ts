export const ACCEPT_INVITATION_MUTATION = `
  mutation AcceptInvitation($input: AcceptInvitationInput!) {
    acceptInvitation(input: $input) {
      accessToken
      user { ... on Teacher { id name role } }
      errors { message path }
    }
  }
`;
