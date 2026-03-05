# GraphQL Migration Design

**Date**: 2026-03-05
**Status**: Approved
**Scope**: Full REST → GraphQL migration + SvelteKit frontend

## Decisions

- **Gem**: `graphql ~> 2.5` (2.5.20, full Rails 8.1 compat)
- **Client**: Apollo Kotlin (KMP apps), SvelteKit frontend (new)
- **Migration**: Full replacement (remove REST entirely)
- **Subscriptions**: Deferred (polling with 10-min TTL)
- **Frontend**: SvelteKit (Svelte 5 + TypeScript) at `front-end/`

## Architecture

### What gets replaced

| REST (remove)          | GraphQL (add)            |
|------------------------|--------------------------|
| 9 controllers          | 1 `GraphqlController`    |
| 8 Alba serializers     | 8+ GraphQL types         |
| 27 REST routes         | 1 POST `/graphql` route  |
| Controller tests       | Schema execution tests   |

### What stays unchanged

- All 16 models + associations
- 5 Pundit policies (called manually in resolvers)
- `Authenticatable` concern (pipes `current_user` into GraphQL context)
- `Permissionable` concern + `RolePermissions` config
- Rack::Attack, CORS, Secure Headers middleware
- Solid Cache (10-min TTL for radar data)
- Devise-JWT auth flow

### Key patterns

- **Auth**: JWT in `Authorization` header → `Authenticatable` → GraphQL context
- **Authorization**: Manual Pundit calls in resolvers + `authorized?` on types
- **N+1**: `GraphQL::Dataloader` with built-in `ActiveRecordSource`
- **Pagination**: Relay connections for unbounded lists, plain arrays for bounded data
- **Errors**: "Errors as data" for mutations, `rescue_from` for system errors
- **Testing**: `Schema.execute()` in Minitest

## Schema

### Queries

```graphql
type Query {
  me: User!
  classrooms: [Classroom!]!
  classroom(id: ID!): Classroom!
  classroomOverview(classroomId: ID!): ClassroomOverview!
  student(id: ID!): Student!
  studentRadar(studentId: ID!): RadarData!
  studentProgress(studentId: ID!): ProgressData!
  studentDailyScores(studentId: ID!, first: Int, after: String): DailyScoreConnection!
  myChildren: [Student!]!
  userPermissions(userId: ID!): [Permission!]!
}
```

### Mutations

```graphql
type Mutation {
  login(email: String!, password: String!): AuthPayload!
  register(input: RegisterInput!): AuthPayload!
  refreshToken(refreshToken: String!): AuthPayload!
  logout: Boolean!
  createDailyScore(input: CreateDailyScoreInput!): DailyScorePayload!
  updateDailyScore(id: ID!, input: UpdateDailyScoreInput!): DailyScorePayload!
  grantPermission(userId: ID!, resource: String!, action: String!): PermissionPayload!
  revokePermission(userId: ID!, resource: String!, action: String!): PermissionPayload!
  togglePermission(id: ID!): PermissionPayload!
  deletePermission(id: ID!): DeletePayload!
}
```

### Key Types

```graphql
union User = Teacher | Parent

type AuthPayload {
  token: String!
  refreshToken: String!
  user: User!
  errors: [UserError!]!
}

type UserError {
  message: String!
  path: [String!]
}

enum SkillCategory { READING MATH WRITING LOGIC SOCIAL }
```

## Auth Flow

1. Client sends `login` mutation (unauthenticated)
2. Server returns `{ token, refreshToken, user }`
3. Client sends JWT in `Authorization: Bearer <token>` header for all subsequent requests
4. `GraphqlController` uses `Authenticatable` to extract `current_user`
5. `current_user` piped into GraphQL context
6. Public mutations (login, register, refresh) skip auth check

## File Structure

```
app/graphql/
├── grewme_schema.rb
├── types/
│   ├── base_object.rb
│   ├── base_mutation.rb
│   ├── query_type.rb
│   ├── mutation_type.rb
│   ├── user_error_type.rb
│   ├── skill_category_enum.rb
│   ├── teacher_type.rb
│   ├── parent_type.rb
│   ├── user_union.rb
│   ├── classroom_type.rb
│   ├── student_type.rb
│   ├── daily_score_type.rb
│   ├── radar_data_type.rb
│   ├── progress_data_type.rb
│   ├── permission_type.rb
│   ├── auth_payload_type.rb
│   └── classroom_overview_type.rb
├── mutations/
│   ├── login.rb
│   ├── register.rb
│   ├── refresh_token.rb
│   ├── logout.rb
│   ├── create_daily_score.rb
│   ├── update_daily_score.rb
│   └── admin/
│       ├── grant_permission.rb
│       ├── revoke_permission.rb
│       ├── toggle_permission.rb
│       └── delete_permission.rb
└── sources/
    └── radar_source.rb
```

## Files to Delete

- `app/controllers/api/v1/` (all 9 controllers)
- `app/resources/` (all 8 Alba serializers)
- REST routes in `config/routes.rb`
- `test/controllers/` (all controller tests)

## Migration Phases

1. Add graphql gem + schema + base types (no breaking changes)
2. Add all queries + mutations
3. Add GraphQL tests
4. Remove REST controllers, serializers, routes, controller tests
