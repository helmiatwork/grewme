export const PROFILE_QUERY = `
  query Me {
    me {
      ... on Teacher {
        id name email role phone bio birthdate gender religion qualification
        addressLine1 addressLine2 city stateProvince postalCode countryCode
        avatarUrl
        classrooms { id name }
      }
      ... on Parent {
        id name email role phone bio birthdate gender qualification
        addressLine1 addressLine2 city stateProvince postalCode countryCode
        avatarUrl
        children { id name }
      }
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile(
    $name: String, $email: String, $phone: String, $bio: String,
    $birthdate: ISO8601Date, $gender: String, $religion: String, $qualification: String,
    $addressLine1: String, $addressLine2: String, $city: String,
    $stateProvince: String, $postalCode: String, $countryCode: String,
    $avatarBlobId: String
  ) {
    updateProfile(
      name: $name, email: $email, phone: $phone, bio: $bio,
      birthdate: $birthdate, gender: $gender, religion: $religion, qualification: $qualification,
      addressLine1: $addressLine1, addressLine2: $addressLine2, city: $city,
      stateProvince: $stateProvince, postalCode: $postalCode, countryCode: $countryCode,
      avatarBlobId: $avatarBlobId
    ) {
      user {
        ... on Teacher {
          id name email phone bio birthdate gender religion qualification
          addressLine1 addressLine2 city stateProvince postalCode countryCode
          avatarUrl
        }
        ... on Parent {
          id name email phone bio birthdate gender qualification
          addressLine1 addressLine2 city stateProvince postalCode countryCode
          avatarUrl
        }
      }
      errors { message path }
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = `
  mutation ChangePassword($currentPassword: String!, $newPassword: String!, $newPasswordConfirmation: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword, newPasswordConfirmation: $newPasswordConfirmation) {
      success
      errors { message path }
    }
  }
`;
