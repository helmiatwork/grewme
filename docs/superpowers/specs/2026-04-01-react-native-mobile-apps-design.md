# Design: React Native Mobile Apps (Parent & Teacher)

**Date:** 2026-04-01  
**Status:** Approved — pending implementation plan

## Problem

The existing `mobile-app-parent/` and `mobile-app-teacher/` directories are Kotlin Multiplatform (KMP) / Compose Multiplatform projects. The team's primary expertise is JavaScript/TypeScript, making KMP a poor fit. Both apps are being replaced with React Native + Expo. The KMP code is discarded entirely.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React Native + Expo SDK 52 (managed workflow) | JS/TS team expertise; Expo simplifies iOS/Android builds |
| Structure | `mobile/` monorepo, yarn workspaces | Max code reuse; separate app bundles for correct App Store listings |
| Navigation | Expo Router (file-based) | Mirrors SvelteKit conventions; pairs naturally with Expo |
| GraphQL client | Apollo Client | Backend is GraphQL-only; normalized cache, typed hooks via codegen |
| Local state | Zustand (auth only) | Apollo handles server state; Zustand just for token + user type |
| Token storage | expo-secure-store | iOS Keychain / Android Keystore; no plain AsyncStorage for tokens |
| Offline | None (online-only) | Deferred — add later if needed |
| Linting | Biome `@biomejs/biome@1.x` | Faster than ESLint + Prettier; config at `mobile/biome.json` (workspace root) |
| Testing | Jest + RNTL + Apollo MockedProvider | No real network calls in tests |
| KMP code | Discarded | Not ported — React Native is a clean rewrite |

## App Identifiers

| App | Display Name | iOS Bundle ID | Android Package |
|-----|-------------|---------------|-----------------|
| Parent | GrewMe for Parents | `id.grewme.parent` | `id.grewme.parent` |
| Teacher | GrewMe for Teachers | `id.grewme.teacher` | `id.grewme.teacher` |

## Repo Structure

The two KMP directories (`mobile-app-parent/`, `mobile-app-teacher/`) are replaced by a single `mobile/` directory:

```
grewme/
└── mobile/
    ├── package.json               # workspace root (yarn workspaces)
    ├── biome.json                 # shared Biome config (workspace root)
    ├── apps/
    │   ├── parent/
    │   │   ├── app/               # Expo Router file-based routes
    │   │   │   ├── index.tsx      # Auth redirect → /(app)/children
    │   │   │   ├── (auth)/
    │   │   │   │   └── login.tsx
    │   │   │   └── (app)/
    │   │   │       ├── _layout.tsx            # ApolloProvider wrapper
    │   │   │       └── children/
    │   │   │           ├── index.tsx          # Children list
    │   │   │           └── [id]/
    │   │   │               ├── _layout.tsx    # Tab container
    │   │   │               ├── radar.tsx
    │   │   │               ├── progress.tsx
    │   │   │               └── history.tsx
    │   │   ├── app.json           # bundle ID: id.grewme.parent
    │   │   └── package.json
    │   └── teacher/
    │       ├── app/
    │       │   ├── index.tsx      # Auth redirect
    │       │   ├── (auth)/
    │       │   │   └── login.tsx
    │       │   └── (app)/
    │       │       ├── _layout.tsx
    │       │       ├── index.tsx              # Dashboard
    │       │       ├── behavior/
    │       │       │   ├── index.tsx          # Award behavior points
    │       │       │   └── history.tsx        # Student behavior history
    │       │       ├── students/
    │       │       │   └── index.tsx          # Class overview (radar charts)
    │       │       └── health/
    │       │           └── index.tsx          # Record health checkups
    │       ├── app.json           # bundle ID: id.grewme.teacher
    │       └── package.json
    └── packages/
        └── shared/
            ├── graphql/
            │   ├── codegen.ts                # GraphQL Code Generator config (requires ts-node)
            │   ├── client.ts                 # Apollo Client setup
            │   ├── queries/
            │   │   ├── children.graphql
            │   │   ├── behavior.graphql
            │   │   └── health.graphql
            │   ├── mutations/
            │   │   ├── auth.graphql
            │   │   ├── behavior.graphql
            │   │   └── health.graphql
            │   └── generated/
            │       └── graphql.ts            # Auto-generated typed hooks (never edit)
            ├── auth/
            │   ├── store.ts                  # Zustand auth store
            │   └── hooks.ts                  # useAuth()
            ├── components/
            │   ├── RadarChart.tsx
            │   ├── LoadingState.tsx
            │   ├── ErrorState.tsx
            │   └── BehaviorBadge.tsx
            └── package.json
```

## Auth & Navigation

### Auth Store (Zustand)

```typescript
interface AuthStore {
  token: string | null
  userType: 'parent' | 'teacher' | null
  activeClassroomId: string | null
  setAuth: (token: string, userType: 'parent' | 'teacher') => void
  setActiveClassroomId: (id: string) => void
  clearAuth: () => void
}
```

- `token` is the JWT **access token** from `data.login.access_token`
- `userType` is derived from `data.login.user.__typename`. The exhaustive set of values is `'Teacher'`, `'Parent'`, `'SchoolManager'`. Normalize: `'Teacher'` → `'teacher'`, `'Parent'` → `'parent'`. If `__typename` is `'SchoolManager'` (a valid backend response when a school manager logs in via the mobile app), call `clearAuth()` and show: "This account type is not supported in this app."
- `activeClassroomId` — set on teacher Dashboard/Class Overview load (first classroom from `classrooms` query). Used by the Award Behavior screen to pass `classroomId` to the mutation.
- Token persisted in `expo-secure-store` (iOS Keychain / Android Keystore)
- On app start: read token from SecureStore → hydrate Zustand store
- Apollo Client reads token from store via auth link on every request
- **Refresh token:** available in `data.login.refresh_token` but refresh flow is out of scope for v1. Treat 401 as session expiry → redirect to login.

### Navigation Flow

```
App starts
  └── index.tsx checks token
        ├── no token  → redirect to /(auth)/login
        └── has token → redirect to /(app)/
                            ├── parent:  /children
                            └── teacher: / (dashboard)
```

- Route group `(auth)` — unauthenticated screens only
- Route group `(app)` — wraps all authenticated screens; provides ApolloProvider
- Logout: `clearAuth()` → SecureStore cleared → auth guard redirects to login
- 401 from API: Apollo error link calls `clearAuth()` → same redirect

## Screen Inventory

### Parent App (5 screens)

| Screen | Route | GraphQL Operation (actual backend field) |
|--------|-------|------------------------------------------|
| Login | `/(auth)/login` | `login(email, password, role: "parent")` mutation |
| Children List | `/(app)/children` | `myChildren` query |
| Child Radar | `/(app)/children/[id]/radar` | `studentRadar(studentId: ID!)` query |
| Child Progress | `/(app)/children/[id]/progress` | `studentProgress(studentId: ID!)` query |
| Child History | `/(app)/children/[id]/history` | `studentDailyScores(studentId: ID!, skillCategory: SkillCategoryEnum, first: 20, after?)` query |

Child detail (`[id]`) is a tab navigator containing Radar, Progress, and History tabs.

**History pagination:** `studentDailyScores` is a graphql-ruby `connection_type`. Pass `first: 20, after: <cursor>` as standard connection arguments; the cursor comes from `pageInfo.endCursor` in the response. `skillCategory` is optional — omit to fetch all subjects. Implementer may choose infinite scroll or a load-more button.

### Teacher App (6 screens)

| Screen | Route | GraphQL Operation (actual backend field) |
|--------|-------|------------------------------------------|
| Login | `/(auth)/login` | `login(email, password, role: "teacher")` mutation |
| Dashboard | `/(app)/` | `classrooms` query → then `classroomBehaviorToday(classroomId)` for first classroom |
| Class Overview | `/(app)/students` | `classroomOverview(classroomId: ID!)` query — returns all students + radar data in one call |
| Award Behavior | `/(app)/behavior` | `awardBehaviorPoint(studentId, classroomId, behaviorCategoryId, note?)` mutation |
| Behavior History | `/(app)/behavior/history` | `studentBehaviorHistory(studentId)` query |
| Record Checkup | `/(app)/health` | `createHealthCheckup(studentId: ID!, measuredAt: ISO8601Date!, weightKg?: Float, heightCm?: Float, headCircumferenceCm?: Float, notes?: String)` mutation |

**Teacher Dashboard:** Shows the teacher's first classroom name and today's behavior summary. Uses two sequential `useQuery` calls: first fetch `classrooms` (to get classroom name + set `activeClassroomId` in Zustand), then fetch `classroomBehaviorToday(classroomId)` with `skip: !activeClassroomId`. Display fields from `ClassroomBehaviorStudentType`: `student.name`, `totalPoints`, `positiveCount`, `negativeCount`, `recentPoints`.

**Class Overview:** Calls `classroomOverview(classroomId: activeClassroomId)` — returns all students and their radar data in one request. Do NOT call `studentRadar` per student (N+1).

**Award Behavior flow:** Teacher navigates from Class Overview → taps a student → navigates to `/(app)/behavior?studentId=X`. The behavior screen receives `studentId` as a query param. `classroomId` is read from `activeClassroomId` in Zustand (set on Dashboard/Class Overview load).

**Behavior History flow:** Teacher taps a student in Class Overview → navigates to `/(app)/behavior/history?studentId=X`. Uses `studentBehaviorHistory(studentId: ID!, startDate?: ISO8601Date, endDate?: ISO8601Date)`. Date filters are optional — omit for full history.

**Record Checkup flow:** Teacher selects a student from a picker on the health screen (backed by `classrooms` + student list from `classroomOverview`). Required fields: `studentId`, `measuredAt`. Optional: `weightKg`, `heightCm`, `headCircumferenceCm`, `notes`.

### Shared Components

| Component | Used by |
|-----------|---------|
| `RadarChart` | Parent radar screen + Teacher class overview |
| `LoadingState` | Both apps, all data-fetching screens |
| `ErrorState` | Both apps, all data-fetching screens |
| `BehaviorBadge` | Teacher behavior screens |

## Data Layer

### GraphQL Code Generator

- Uses `@graphql-codegen/cli` v3+ with `ts-node` as the runner
- Configured in `packages/shared/graphql/codegen.ts`
- Reads `.graphql` files → generates typed hooks in `generated/graphql.ts`
- `packages/shared/package.json` script: `"codegen": "graphql-codegen --config graphql/codegen.ts"`
- Run from workspace root: `yarn codegen`
- Generated hooks example:
  ```typescript
  const { data, loading, error } = useMyChildrenQuery()
  const [awardPoint] = useAwardBehaviorPointMutation()
  ```

### Apollo Client

Configured in `packages/shared/graphql/client.ts`:

- **Auth link** — reads token from Zustand store, adds `Authorization: Bearer <token>`
- **Error link** — catches 401 responses, calls `clearAuth()`, triggers navigation to login
- **HTTP link** — points to `EXPO_PUBLIC_API_URL/graphql`
- **InMemoryCache** — default config, no persistence (online-only)

### Environment

Each app has `.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000   # dev
EXPO_PUBLIC_API_URL=https://api.grewme.id  # prod
```

## Testing Strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Shared components | Jest + React Native Testing Library | RadarChart, LoadingState, ErrorState render correctly |
| Auth store | Jest | Zustand store: setAuth, clearAuth, hydration, userType derivation |
| Screen integration | Jest + RNTL + Apollo MockedProvider | Screens render correct data from mocked responses |
| E2E | Detox | Deferred — not in initial build |

- `yarn test` at workspace root runs all tests across both apps and shared package
- No real network calls in tests — Apollo `MockedProvider` provides fixture responses

## What's Not Included (YAGNI)

- Offline / cache persistence (add later if needed)
- JWT refresh token flow (treat 401 as logout for v1)
- Push notifications
- In-app messaging
- Android-specific testing (iOS-first)
- E2E tests (Detox)
- Real-time updates via WebSocket / ActionCable

## Migration Notes

- `mobile-app-parent/` and `mobile-app-teacher/` (KMP) are deleted
- `mobile/` directory is created fresh
- No code is ported from KMP — React Native is a clean rewrite
- KMP design doc (`docs/plans/2026-03-04-parent-app-design.md`) kept as historical reference
