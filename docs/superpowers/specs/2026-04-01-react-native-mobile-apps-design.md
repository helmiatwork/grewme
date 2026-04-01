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
| Linting | Biome | Faster than ESLint + Prettier, zero config |
| Testing | Jest + RNTL + Apollo MockedProvider | No real network calls in tests |
| KMP code | Discarded | Not ported — React Native is a clean rewrite |

## Repo Structure

The two KMP directories (`mobile-app-parent/`, `mobile-app-teacher/`) are replaced by a single `mobile/` directory:

```
grewme/
└── mobile/
    ├── package.json               # workspace root (yarn workspaces)
    ├── apps/
    │   ├── parent/
    │   │   ├── app/               # Expo Router file-based routes
    │   │   │   ├── index.tsx      # Auth redirect
    │   │   │   ├── (auth)/
    │   │   │   │   └── login.tsx
    │   │   │   └── (app)/
    │   │   │       ├── _layout.tsx
    │   │   │       └── children/
    │   │   │           ├── index.tsx          # Children list
    │   │   │           └── [id]/
    │   │   │               ├── _layout.tsx    # Tab container
    │   │   │               ├── radar.tsx
    │   │   │               ├── progress.tsx
    │   │   │               └── history.tsx
    │   │   ├── app.json
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
    │       ├── app.json
    │       └── package.json
    └── packages/
        └── shared/
            ├── graphql/
            │   ├── codegen.ts                # GraphQL Code Generator config
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
  setAuth: (token: string, userType: string) => void
  clearAuth: () => void
}
```

- Token persisted in `expo-secure-store` (iOS Keychain / Android Keystore)
- On app start: read token from SecureStore → hydrate Zustand store
- Apollo Client reads token from store via auth link on every request

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

| Screen | Route | GraphQL Operation |
|--------|-------|-------------------|
| Login | `/(auth)/login` | `signInParent` mutation |
| Children List | `/(app)/children` | `parentChildren` query |
| Child Radar | `/(app)/children/[id]/radar` | `studentRadarData` query |
| Child Progress | `/(app)/children/[id]/progress` | `studentProgress` query |
| Child History | `/(app)/children/[id]/history` | `studentDailyScores` query |

Child detail (`[id]`) is a tab navigator containing Radar, Progress, and History tabs.

### Teacher App (6 screens)

| Screen | Route | GraphQL Operation |
|--------|-------|-------------------|
| Login | `/(auth)/login` | `signInTeacher` mutation |
| Dashboard | `/(app)/` | `teacherClassroom` query |
| Class Overview | `/(app)/students` | `classroomStudents` query + radar data |
| Award Behavior | `/(app)/behavior` | `awardBehaviorPoint` mutation |
| Behavior History | `/(app)/behavior/history` | `studentBehaviorHistory` query |
| Record Checkup | `/(app)/health` | `createHealthCheckup` mutation |

### Shared Components

| Component | Used by |
|-----------|---------|
| `RadarChart` | Parent radar screen + Teacher class overview |
| `LoadingState` | Both apps, all data-fetching screens |
| `ErrorState` | Both apps, all data-fetching screens |
| `BehaviorBadge` | Teacher behavior screens |

## Data Layer

### GraphQL Code Generator

- Configured in `packages/shared/graphql/codegen.ts`
- Reads `.graphql` files → generates typed hooks in `generated/graphql.ts`
- Run: `yarn codegen` at workspace root
- Generated hooks example:
  ```typescript
  const { data, loading, error } = useParentChildrenQuery()
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
| Auth store | Jest | Zustand store: setAuth, clearAuth, hydration |
| Screen integration | Jest + RNTL + Apollo MockedProvider | Screens render correct data from mocked responses |
| E2E | Detox | Deferred — not in initial build |

- `yarn test` at workspace root runs all tests across apps and shared package
- No real network calls in tests — Apollo `MockedProvider` provides fixture responses

## What's Not Included (YAGNI)

- Offline / cache persistence (add later if needed)
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
