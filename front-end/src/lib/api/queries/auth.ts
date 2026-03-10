export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!, $role: String!) {
    login(email: $email, password: $password, role: $role) {
      accessToken
      refreshToken
      expiresIn
      user {
        ... on Teacher {
          id
          name
          email
        }
        ... on Parent {
          id
          name
          email
          phone
        }
        ... on SchoolManager {
          id
          name
          email
        }
      }
      errors {
        message
        path
      }
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      expiresIn
      user {
        ... on Teacher {
          id
          name
          email
        }
        ... on Parent {
          id
          name
          email
          phone
        }
      }
      errors {
        message
        path
      }
    }
  }
`;

export const REGISTER_SCHOOL_MANAGER_MUTATION = `
  mutation RegisterSchoolManager(
    $name: String!
    $email: String!
    $password: String!
    $passwordConfirmation: String!
    $schoolName: String!
    $minGrade: Int!
    $maxGrade: Int!
    $addressLine1: String!
    $city: String!
    $stateProvince: String!
    $postalCode: String!
    $countryCode: String!
  ) {
    registerSchoolManager(
      name: $name
      email: $email
      password: $password
      passwordConfirmation: $passwordConfirmation
      schoolName: $schoolName
      minGrade: $minGrade
      maxGrade: $maxGrade
      addressLine1: $addressLine1
      city: $city
      stateProvince: $stateProvince
      postalCode: $postalCode
      countryCode: $countryCode
    ) {
      accessToken
      refreshToken
      expiresIn
      user {
        ... on SchoolManager {
          id
          name
          email
        }
      }
      school { id name }
      errors { message path }
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($refreshToken: String!, $role: String!) {
    refreshToken(refreshToken: $refreshToken, role: $role) {
      accessToken
      refreshToken
      expiresIn
      errors {
        message
        path
      }
    }
  }
`;

export const LOGOUT_MUTATION = `
  mutation Logout {
    logout {
      success
      errors {
        message
        path
      }
    }
  }
`;

export const ME_QUERY = `
  query Me {
    me {
      ... on Teacher {
        id
        name
        email
        avatarUrl
      }
      ... on Parent {
        id
        name
        email
        phone
        avatarUrl
      }
      ... on SchoolManager {
        id
        name
        email
        avatarUrl
      }
    }
  }
`;
