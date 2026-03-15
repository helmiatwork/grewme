# app/controllers/concerns/

## Responsibility
Shared controller behaviors. Primary concern is JWT authentication handling.

## Design
- **Authenticatable**: Extracts JWT from `Authorization` header, decodes with HS256 secret, finds user by payload `{ sub: user_id, type: "Teacher"|"Parent"|"SchoolManager" }`. Returns nil for invalid/expired tokens (GraphQL mutations handle auth enforcement).

## Flow
1. Before action or explicit call → `current_user` method
2. Extract Bearer token from header
3. `JWT.decode(token, secret, algorithm: 'HS256')`
4. Find user by `sub` (ID) and `type` (model class)
5. Memoize and return user (or nil)

## Integration
- **Included in**: ApplicationController
- **Used by**: GraphqlController to populate context[:current_user]
- **Depends on**: Devise-JWT configuration for token format/secret
