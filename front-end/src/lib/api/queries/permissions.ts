export const USER_PERMISSIONS_QUERY = `
  query UserPermissions($userId: ID!, $userType: String!) {
    userPermissions(userId: $userId, userType: $userType) {
      userId
      role
      overrides {
        id
        resource
        action
        granted
      }
      effective {
        resource
        action
        granted
        source
      }
    }
  }
`;

export const GRANT_PERMISSION_MUTATION = `
  mutation GrantPermission($userId: ID!, $userType: String!, $resource: String!, $action: String!) {
    grantPermission(userId: $userId, userType: $userType, resource: $resource, action: $action) {
      permission {
        id
        resource
        action
        granted
      }
      errors {
        message
        path
      }
    }
  }
`;

export const REVOKE_PERMISSION_MUTATION = `
  mutation RevokePermission($userId: ID!, $userType: String!, $resource: String!, $action: String!) {
    revokePermission(userId: $userId, userType: $userType, resource: $resource, action: $action) {
      permission {
        id
        resource
        action
        granted
      }
      errors {
        message
        path
      }
    }
  }
`;

export const TOGGLE_PERMISSION_MUTATION = `
  mutation TogglePermission($id: ID!) {
    togglePermission(id: $id) {
      permission {
        id
        resource
        action
        granted
      }
      errors {
        message
        path
      }
    }
  }
`;

export const DELETE_PERMISSION_MUTATION = `
  mutation DeletePermission($id: ID!) {
    deletePermission(id: $id) {
      success
      errors {
        message
        path
      }
    }
  }
`;
