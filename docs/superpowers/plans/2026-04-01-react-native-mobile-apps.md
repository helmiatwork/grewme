# React Native Mobile Apps Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the KMP `mobile-app-parent/` and `mobile-app-teacher/` directories with a React Native + Expo monorepo at `mobile/` containing a parent app (5 screens) and teacher app (6 screens) sharing GraphQL, auth, and UI components.

**Architecture:** Yarn workspaces monorepo under `mobile/` with `apps/parent`, `apps/teacher`, and `packages/shared`. Apollo Client handles all GraphQL data; Zustand holds auth tokens and teacher classroom context. Expo Router provides file-based navigation mirroring SvelteKit conventions.

**Tech Stack:** React Native, Expo SDK 52, Expo Router, Apollo Client 3, GraphQL Code Generator, Zustand 5, expo-secure-store, Jest + React Native Testing Library, Biome 1.x

**Spec:** `docs/superpowers/specs/2026-04-01-react-native-mobile-apps-design.md`

**PR Strategy (3 PRs — implement in order):**
- **PR 1** — `feature/react-native-foundation`: Chunk 1 (monorepo + shared package)
- **PR 2** — `feature/react-native-parent-app`: Chunk 2 (parent app), branches from PR 1 merge
- **PR 3** — `feature/react-native-teacher-app`: Chunk 3 (teacher app), branches from PR 1 merge

---

## Chunk 1: Monorepo Foundation + Shared Package

> **PR 1:** `feature/react-native-foundation` → main

### Task 1: Delete KMP directories and create branch

**Files:**
- Delete: `mobile-app-parent/` (entire directory)
- Delete: `mobile-app-teacher/` (entire directory)
- Create: `mobile/` (directory structure)

- [ ] **Step 1: Create feature branch**

```bash
rtk git checkout main && rtk git pull
rtk git checkout -b feature/react-native-foundation
```

- [ ] **Step 2: Delete KMP directories**

```bash
rtk git rm -r mobile-app-parent/ mobile-app-teacher/
```

- [ ] **Step 3: Commit deletion**

```bash
rtk git commit -m "chore: remove KMP mobile apps (replaced by React Native)"
```

---

### Task 2: Workspace root and Biome config

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/biome.json`
- Create: `mobile/.gitignore`

- [ ] **Step 1: Create mobile directory**

```bash
mkdir -p mobile/apps mobile/packages
```

- [ ] **Step 2: Create `mobile/package.json`**

```json
{
  "name": "grewme-mobile",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "codegen": "yarn workspace @grewme/shared codegen",
    "test": "yarn workspaces run test --passWithNoTests"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4"
  }
}
```

- [ ] **Step 3: Create `mobile/biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5"
    }
  }
}
```

- [ ] **Step 4: Create `mobile/.gitignore`**

```
node_modules/
.expo/
dist/
*.log
.env
.env.local
```

- [ ] **Step 5: Install workspace dependencies**

```bash
cd mobile && yarn install
```

Expected: yarn creates `node_modules/` and links workspaces.

- [ ] **Step 6: Commit**

```bash
rtk git add mobile/
rtk git commit -m "feat: add React Native monorepo workspace root"
```

---

### Task 3: Shared package scaffold

**Files:**
- Create: `mobile/packages/shared/package.json`
- Create: `mobile/packages/shared/tsconfig.json`
- Create: `mobile/packages/shared/index.ts`

- [ ] **Step 1: Create `mobile/packages/shared/package.json`**

```json
{
  "name": "@grewme/shared",
  "version": "0.0.1",
  "main": "index.ts",
  "scripts": {
    "codegen": "graphql-codegen --config graphql/codegen.ts",
    "test": "jest --passWithNoTests"
  },
  "dependencies": {
    "@apollo/client": "^3.11.0",
    "graphql": "^16.9.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@graphql-codegen/cli": "^5.0.0",
    "@graphql-codegen/typescript": "^4.0.0",
    "@graphql-codegen/typescript-operations": "^4.0.0",
    "@graphql-codegen/typescript-react-apollo": "^4.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.6.0",
    "@types/react": "^18.3.0",
    "jest": "^29.0.0",
    "jest-expo": "~52.0.0",
    "@testing-library/react-native": "^12.0.0",
    "react-test-renderer": "^18.3.0"
  },
  "peerDependencies": {
    "react": "^18.3.0",
    "react-native": "*",
    "react-native-svg": "^15.0.0",
    "expo-secure-store": "*"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/react-native/extend-expect"]
  }
}
```

- [ ] **Step 2: Create `mobile/packages/shared/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-native",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `mobile/packages/shared/index.ts`** (barrel exports — fill in as each module is built)

```typescript
export * from './auth/store'
export * from './auth/hooks'
export * from './components/RadarChart'
export * from './components/LoadingState'
export * from './components/ErrorState'
export * from './components/BehaviorBadge'
export { apolloClient, clearAuthCallback } from './graphql/client'
```

- [ ] **Step 4: Install shared package deps**

```bash
cd mobile && yarn install
```

- [ ] **Step 5: Commit**

```bash
rtk git add mobile/packages/
rtk git commit -m "feat: add shared package scaffold"
```

---

### Task 4: Auth store (Zustand)

**Files:**
- Create: `mobile/packages/shared/auth/store.ts`
- Create: `mobile/packages/shared/auth/hooks.ts`
- Create: `mobile/packages/shared/auth/__tests__/store.test.ts`

- [ ] **Step 1: Write the failing test**

Create `mobile/packages/shared/auth/__tests__/store.test.ts`:

```typescript
import { act } from 'react'
import { useAuthStore } from '../store'

// Reset store between tests
beforeEach(() => {
  useAuthStore.setState({
    token: null,
    userType: null,
    activeClassroomId: null,
    activeSchoolId: null,
  })
})

describe('AuthStore', () => {
  it('starts with empty state', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.userType).toBeNull()
    expect(state.activeClassroomId).toBeNull()
    expect(state.activeSchoolId).toBeNull()
  })

  it('setAuth stores token and userType', () => {
    act(() => {
      useAuthStore.getState().setAuth('jwt-token-123', 'parent')
    })
    const state = useAuthStore.getState()
    expect(state.token).toBe('jwt-token-123')
    expect(state.userType).toBe('parent')
  })

  it('clearAuth resets all state', () => {
    act(() => {
      useAuthStore.getState().setAuth('jwt-token-123', 'teacher')
      useAuthStore.getState().setActiveClassroomId('classroom-1')
      useAuthStore.getState().setActiveSchoolId('school-1')
      useAuthStore.getState().clearAuth()
    })
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.userType).toBeNull()
    expect(state.activeClassroomId).toBeNull()
    expect(state.activeSchoolId).toBeNull()
  })

  it('setActiveClassroomId stores classroom id', () => {
    act(() => {
      useAuthStore.getState().setActiveClassroomId('cls-42')
    })
    expect(useAuthStore.getState().activeClassroomId).toBe('cls-42')
  })

  it('setActiveSchoolId stores school id', () => {
    act(() => {
      useAuthStore.getState().setActiveSchoolId('sch-7')
    })
    expect(useAuthStore.getState().activeSchoolId).toBe('sch-7')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd mobile/packages/shared && yarn test auth/__tests__/store.test.ts
```

Expected: FAIL — `Cannot find module '../store'`

- [ ] **Step 3: Create `mobile/packages/shared/auth/store.ts`**

```typescript
import { create } from 'zustand'

interface AuthStore {
  token: string | null
  userType: 'parent' | 'teacher' | null
  activeClassroomId: string | null
  activeSchoolId: string | null
  setAuth: (token: string, userType: 'parent' | 'teacher') => void
  setActiveClassroomId: (id: string) => void
  setActiveSchoolId: (id: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  userType: null,
  activeClassroomId: null,
  activeSchoolId: null,
  setAuth: (token, userType) => set({ token, userType }),
  setActiveClassroomId: (activeClassroomId) => set({ activeClassroomId }),
  setActiveSchoolId: (activeSchoolId) => set({ activeSchoolId }),
  clearAuth: () => {
    // MUST delete from SecureStore — store-only clear leaves stale token on next app launch
    import('expo-secure-store').then((SecureStore) => {
      SecureStore.deleteItemAsync('auth_token')
    })
    set({ token: null, userType: null, activeClassroomId: null, activeSchoolId: null })
  },
}))
```

- [ ] **Step 4: Create `mobile/packages/shared/auth/hooks.ts`**

```typescript
import { useAuthStore } from './store'

export function useAuth() {
  const token = useAuthStore((s) => s.token)
  const userType = useAuthStore((s) => s.userType)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  return { token, userType, isAuthenticated: !!token, clearAuth }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd mobile/packages/shared && yarn test auth/__tests__/store.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 6: Commit**

```bash
rtk git add mobile/packages/shared/auth/
rtk git commit -m "feat: add Zustand auth store with classroom/school context"
```

---

### Task 5: Apollo Client

**Files:**
- Create: `mobile/packages/shared/graphql/client.ts`
- Create: `mobile/packages/shared/graphql/__tests__/client.test.ts`

- [ ] **Step 1: Write the failing test**

Create `mobile/packages/shared/graphql/__tests__/client.test.ts`:

```typescript
import { apolloClient, clearAuthCallback } from '../client'
import { useAuthStore } from '../../auth/store'

beforeEach(() => {
  useAuthStore.setState({ token: null, userType: null, activeClassroomId: null, activeSchoolId: null })
  clearAuthCallback.current = null
})

describe('apolloClient', () => {
  it('is an ApolloClient instance', () => {
    expect(apolloClient).toBeDefined()
    expect(typeof apolloClient.query).toBe('function')
  })
})

describe('clearAuthCallback', () => {
  it('starts as null', () => {
    expect(clearAuthCallback.current).toBeNull()
  })

  it('can be set and called', () => {
    const mockFn = jest.fn()
    clearAuthCallback.current = mockFn
    clearAuthCallback.current()
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd mobile/packages/shared && yarn test graphql/__tests__/client.test.ts
```

Expected: FAIL — `Cannot find module '../client'`

- [ ] **Step 3: Create `mobile/packages/shared/graphql/client.ts`**

```typescript
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { useAuthStore } from '../auth/store'

/**
 * Ref set by each app's (app)/_layout.tsx to bridge Apollo's error link
 * (which runs outside the React tree) to Expo Router's navigation.
 *
 * Usage in _layout.tsx:
 *   import { clearAuthCallback } from '@grewme/shared'
 *   useEffect(() => {
 *     clearAuthCallback.current = () => router.replace('/(auth)/login')
 *   }, [])
 */
export const clearAuthCallback: { current: (() => void) | null } = { current: null }

const httpLink = createHttpLink({
  uri: `${process.env['EXPO_PUBLIC_API_URL']}/graphql`,
})

const authLink = setContext((_, { headers }: { headers?: Record<string, string> }) => {
  const token = useAuthStore.getState().token
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }
})

const errorLink = onError(({ networkError }) => {
  if (
    networkError &&
    'statusCode' in networkError &&
    (networkError as { statusCode: number }).statusCode === 401
  ) {
    useAuthStore.getState().clearAuth()
    clearAuthCallback.current?.()
  }
})

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd mobile/packages/shared && yarn test graphql/__tests__/client.test.ts
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
rtk git add mobile/packages/shared/graphql/client.ts mobile/packages/shared/graphql/__tests__/
rtk git commit -m "feat: add Apollo Client with auth link and 401 error handler"
```

---

### Task 6: GraphQL SDL and codegen

**Files:**
- Create: `mobile/packages/shared/graphql/schema.graphql` (dumped from backend)
- Create: `mobile/packages/shared/graphql/codegen.ts`
- Create: `mobile/packages/shared/graphql/queries/children.graphql`
- Create: `mobile/packages/shared/graphql/queries/behavior.graphql`
- Create: `mobile/packages/shared/graphql/queries/health.graphql`
- Create: `mobile/packages/shared/graphql/mutations/auth.graphql`
- Create: `mobile/packages/shared/graphql/mutations/behavior.graphql`
- Create: `mobile/packages/shared/graphql/mutations/health.graphql`
- Create: `mobile/packages/shared/graphql/generated/graphql.ts` (auto-generated, do not edit)

- [ ] **Step 1: Dump the SDL from the backend**

```bash
cd /Users/ichigo/Documents/repo/grewme/backend && bundle exec rails graphql:schema:dump
cp schema.graphql ../mobile/packages/shared/graphql/schema.graphql
```

Expected: `mobile/packages/shared/graphql/schema.graphql` created with full schema.

- [ ] **Step 2: Create `mobile/packages/shared/graphql/codegen.ts`**

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: [
    './queries/**/*.graphql',
    './mutations/**/*.graphql',
  ],
  generates: {
    './generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withResultType: false,
        withMutationFn: false,
      },
    },
  },
}

export default config
```

- [ ] **Step 3: Create `mobile/packages/shared/graphql/queries/children.graphql`**

```graphql
query MyChildren {
  myChildren {
    id
    name
    classrooms {
      id
      name
    }
  }
}

query StudentRadar($studentId: ID!) {
  studentRadar(studentId: $studentId) {
    studentId
    studentName
    skills {
      reading
      math
      writing
      logic
      social
    }
  }
}

query StudentProgress($studentId: ID!) {
  studentProgress(studentId: $studentId) {
    weeks {
      period
      skills {
        reading
        math
        writing
        logic
        social
      }
    }
  }
}

query StudentDailyScores($studentId: ID!, $skillCategory: SkillCategoryEnum, $first: Int, $after: String) {
  studentDailyScores(studentId: $studentId, skillCategory: $skillCategory, first: $first, after: $after) {
    nodes {
      id
      date
      skillCategory
      score
      notes
      teacher {
        id
        name
      }
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

- [ ] **Step 4: Create `mobile/packages/shared/graphql/queries/behavior.graphql`**

```graphql
query BehaviorCategories($schoolId: ID!) {
  behaviorCategories(schoolId: $schoolId) {
    id
    name
    description
    pointValue
    isPositive
    icon
    color
    position
  }
}

query Classrooms {
  classrooms {
    id
    name
    school {
      id
    }
  }
}

query ClassroomBehaviorToday($classroomId: ID!) {
  classroomBehaviorToday(classroomId: $classroomId) {
    student {
      id
      name
    }
    totalPoints
    positiveCount
    negativeCount
    recentPoints {
      id
      pointValue
      awardedAt
      behaviorCategory {
        name
        isPositive
      }
    }
  }
}

query ClassroomOverview($classroomId: ID!) {
  classroomOverview(classroomId: $classroomId) {
    classroomId
    classroomName
    students {
      studentId
      studentName
      skills {
        reading
        math
        writing
        logic
        social
      }
    }
  }
}

query StudentBehaviorHistory($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
  studentBehaviorHistory(studentId: $studentId, startDate: $startDate, endDate: $endDate) {
    id
    pointValue
    note
    awardedAt
    revokable
    teacher {
      id
      name
    }
    behaviorCategory {
      name
      isPositive
      icon
      color
    }
  }
}
```

**`ClassroomOverviewType` fields (verified):** `classroomId`, `classroomName`, `students: [RadarDataType]` — each student entry includes `studentId`, `studentName`, `skills { reading, math, writing, logic, social }`. No separate `radarData` field.

- [ ] **Step 5: Create `mobile/packages/shared/graphql/queries/health.graphql`**

```graphql
query StudentHealthCheckups($studentId: ID!) {
  studentHealthCheckups(studentId: $studentId) {
    id
    measuredAt
    weightKg
    heightCm
    headCircumferenceCm
    bmi
    bmiCategory
    student {
      id
      name
    }
  }
}
```

- [ ] **Step 6: Create `mobile/packages/shared/graphql/mutations/auth.graphql`**

```graphql
mutation Login($email: String!, $password: String!, $role: String!) {
  login(email: $email, password: $password, role: $role) {
    accessToken
    refreshToken
    user {
      __typename
      ... on Teacher {
        id
        name
        email
      }
      ... on Parent {
        id
        name
        email
      }
    }
    errors {
      message
    }
  }
}
```

- [ ] **Step 7: Create `mobile/packages/shared/graphql/mutations/behavior.graphql`**

```graphql
mutation AwardBehaviorPoint(
  $studentId: ID!
  $classroomId: ID!
  $behaviorCategoryId: ID!
  $note: String
) {
  awardBehaviorPoint(
    studentId: $studentId
    classroomId: $classroomId
    behaviorCategoryId: $behaviorCategoryId
    note: $note
  ) {
    behaviorPoint {
      id
      pointValue
      awardedAt
    }
    dailyTotal
    errors {
      message
    }
  }
}

mutation RevokeBehaviorPoint($id: ID!) {
  revokeBehaviorPoint(id: $id) {
    behaviorPoint {
      id
      revokedAt
    }
    errors {
      message
    }
  }
}
```

- [ ] **Step 8: Create `mobile/packages/shared/graphql/mutations/health.graphql`**

```graphql
mutation CreateHealthCheckup(
  $studentId: ID!
  $measuredAt: ISO8601Date!
  $weightKg: Float
  $heightCm: Float
  $headCircumferenceCm: Float
  $notes: String
) {
  createHealthCheckup(
    studentId: $studentId
    measuredAt: $measuredAt
    weightKg: $weightKg
    heightCm: $heightCm
    headCircumferenceCm: $headCircumferenceCm
    notes: $notes
  ) {
    healthCheckup {
      id
      measuredAt
      weightKg
      heightCm
      headCircumferenceCm
      bmi
      bmiCategory
    }
    errors {
      message
    }
  }
}
```

- [ ] **Step 9: Run codegen**

```bash
cd mobile && yarn codegen
```

Expected: `mobile/packages/shared/graphql/generated/graphql.ts` created with typed hooks like `useMyChildrenQuery`, `useLoginMutation`, etc. Fix any field name mismatches against the SDL.

- [ ] **Step 10: Commit**

```bash
rtk git add mobile/packages/shared/graphql/
rtk git commit -m "feat: add GraphQL SDL, codegen config, and .graphql operation files"
```

---

### Task 7: Shared UI components

**Files:**
- Create: `mobile/packages/shared/components/RadarChart.tsx`
- Create: `mobile/packages/shared/components/LoadingState.tsx`
- Create: `mobile/packages/shared/components/ErrorState.tsx`
- Create: `mobile/packages/shared/components/BehaviorBadge.tsx`
- Create: `mobile/packages/shared/components/__tests__/RadarChart.test.tsx`
- Create: `mobile/packages/shared/components/__tests__/LoadingState.test.tsx`

- [ ] **Step 1: Write failing test for RadarChart**

Create `mobile/packages/shared/components/__tests__/RadarChart.test.tsx`:

```typescript
import React from 'react'
import { render } from '@testing-library/react-native'
import { RadarChart } from '../RadarChart'

const skills = { reading: 80, math: 70, writing: 60, logic: 75, social: 85 }

it('renders without crashing', () => {
  const { getByTestId } = render(<RadarChart skills={skills} />)
  expect(getByTestId('radar-chart')).toBeTruthy()
})

it('renders all 5 skill labels', () => {
  const { getByText } = render(<RadarChart skills={skills} />)
  expect(getByText('Reading')).toBeTruthy()
  expect(getByText('Math')).toBeTruthy()
  expect(getByText('Writing')).toBeTruthy()
  expect(getByText('Logic')).toBeTruthy()
  expect(getByText('Social')).toBeTruthy()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd mobile/packages/shared && yarn test components/__tests__/RadarChart.test.tsx
```

Expected: FAIL — `Cannot find module '../RadarChart'`

- [ ] **Step 3: Create `mobile/packages/shared/components/RadarChart.tsx`**

5-axis pentagon radar chart using React Native's SVG (via `react-native-svg`). Add `react-native-svg` to shared peer deps.

```typescript
import React from 'react'
import { View } from 'react-native'
import Svg, { Polygon, Line, Text as SvgText } from 'react-native-svg'

export interface RadarChartProps {
  skills: {
    reading: number
    math: number
    writing: number
    logic: number
    social: number
  }
  size?: number
}

const AXES = ['Reading', 'Math', 'Writing', 'Logic', 'Social'] as const
const SKILL_KEYS: (keyof RadarChartProps['skills'])[] = [
  'reading', 'math', 'writing', 'logic', 'social',
]
const LEVELS = 3

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleIndex: number,
  total: number,
): { x: number; y: number } {
  const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

export function RadarChart({ skills, size = 200 }: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.35
  const labelOffset = size * 0.08

  // Build grid polygon points for each level
  const gridLevels = Array.from({ length: LEVELS }, (_, i) => {
    const r = (maxR * (i + 1)) / LEVELS
    return AXES.map((_, idx) => {
      const pt = polarToCartesian(cx, cy, r, idx, AXES.length)
      return `${pt.x},${pt.y}`
    }).join(' ')
  })

  // Build data polygon from skills (values 0-100)
  const dataPoints = SKILL_KEYS.map((key, idx) => {
    const val = Math.min(100, Math.max(0, skills[key] ?? 0))
    const r = (maxR * val) / 100
    const pt = polarToCartesian(cx, cy, r, idx, AXES.length)
    return `${pt.x},${pt.y}`
  }).join(' ')

  return (
    <View testID="radar-chart">
      <Svg width={size} height={size}>
        {/* Grid */}
        {gridLevels.map((points, i) => (
          <Polygon
            key={i}
            points={points}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth={1}
          />
        ))}
        {/* Axis lines */}
        {AXES.map((_, idx) => {
          const end = polarToCartesian(cx, cy, maxR, idx, AXES.length)
          return (
            <Line
              key={idx}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="#e0e0e0"
              strokeWidth={1}
            />
          )
        })}
        {/* Data polygon */}
        <Polygon
          points={dataPoints}
          fill="rgba(99, 102, 241, 0.3)"
          stroke="#6366f1"
          strokeWidth={2}
        />
        {/* Axis labels */}
        {AXES.map((label, idx) => {
          const pt = polarToCartesian(cx, cy, maxR + labelOffset, idx, AXES.length)
          return (
            <SvgText
              key={label}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              alignmentBaseline="middle"
              fontSize={10}
              fill="#374151"
            >
              {label}
            </SvgText>
          )
        })}
      </Svg>
    </View>
  )
}
```

- [ ] **Step 4: Write failing test for LoadingState**

Create `mobile/packages/shared/components/__tests__/LoadingState.test.tsx`:

```typescript
import React from 'react'
import { render } from '@testing-library/react-native'
import { LoadingState } from '../LoadingState'

it('renders an activity indicator', () => {
  const { getByTestId } = render(<LoadingState />)
  expect(getByTestId('loading-indicator')).toBeTruthy()
})
```

- [ ] **Step 5: Create `mobile/packages/shared/components/LoadingState.tsx`**

```typescript
import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'

export function LoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator testID="loading-indicator" size="large" color="#6366f1" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
```

- [ ] **Step 6: Write failing test for ErrorState**

Create `mobile/packages/shared/components/__tests__/ErrorState.test.tsx`:

```typescript
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ErrorState } from '../ErrorState'

it('renders default message', () => {
  const { getByText } = render(<ErrorState />)
  expect(getByText('Something went wrong.')).toBeTruthy()
})

it('renders custom message', () => {
  const { getByText } = render(<ErrorState message="Network error" />)
  expect(getByText('Network error')).toBeTruthy()
})

it('calls onRetry when Try again is pressed', () => {
  const onRetry = jest.fn()
  const { getByText } = render(<ErrorState onRetry={onRetry} />)
  fireEvent.press(getByText('Try again'))
  expect(onRetry).toHaveBeenCalledTimes(1)
})
```

Run: `cd mobile/packages/shared && yarn test components/__tests__/ErrorState.test.tsx`
Expected: FAIL — `Cannot find module '../ErrorState'`

- [ ] **Step 6b: Create `mobile/packages/shared/components/ErrorState.tsx`**

```typescript
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
})
```

- [ ] **Step 7: Write failing test for BehaviorBadge**

Create `mobile/packages/shared/components/__tests__/BehaviorBadge.test.tsx`:

```typescript
import React from 'react'
import { render } from '@testing-library/react-native'
import { BehaviorBadge } from '../BehaviorBadge'

it('renders name and positive point value', () => {
  const { getByText } = render(
    <BehaviorBadge name="Helping Others" pointValue={5} isPositive={true} />
  )
  expect(getByText('Helping Others')).toBeTruthy()
  expect(getByText('+5')).toBeTruthy()
})

it('renders negative point value without plus sign', () => {
  const { getByText } = render(
    <BehaviorBadge name="Disruption" pointValue={-3} isPositive={false} />
  )
  expect(getByText('-3')).toBeTruthy()
})
```

Run: `cd mobile/packages/shared && yarn test components/__tests__/BehaviorBadge.test.tsx`
Expected: FAIL — `Cannot find module '../BehaviorBadge'`

- [ ] **Step 7b: Create `mobile/packages/shared/components/BehaviorBadge.tsx`**

```typescript
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface BehaviorBadgeProps {
  name: string
  pointValue: number
  isPositive: boolean
  color?: string
}

export function BehaviorBadge({ name, pointValue, isPositive, color = '#6366f1' }: BehaviorBadgeProps) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={styles.name}>{name}</Text>
      <Text style={[styles.points, { color: isPositive ? '#16a34a' : '#dc2626' }]}>
        {isPositive ? '+' : ''}{pointValue}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  name: { fontSize: 14, fontWeight: '500', color: '#111827' },
  points: { fontSize: 14, fontWeight: '700' },
})
```

- [ ] **Step 8: Run all shared component tests**

```bash
cd mobile/packages/shared && yarn test components/
```

Expected: PASS — 3 tests

- [ ] **Step 9: Commit**

```bash
rtk git add mobile/packages/shared/components/
rtk git commit -m "feat: add shared UI components (RadarChart, LoadingState, ErrorState, BehaviorBadge)"
```

- [ ] **Step 10: Open PR 1**

```bash
rtk git push -u origin feature/react-native-foundation
gh pr create \
  --title "feat: React Native monorepo foundation + shared package" \
  --body "$(cat <<'EOF'
## Overview
Replaces KMP mobile-app-parent/ and mobile-app-teacher/ with a React Native + Expo monorepo at mobile/. This PR establishes the shared foundation: workspace setup, Zustand auth store, Apollo Client, GraphQL codegen, and shared UI components.

## Features & Fixes
- Delete KMP directories (mobile-app-parent/, mobile-app-teacher/)
- Yarn workspaces monorepo at mobile/ (apps/*, packages/*)
- @grewme/shared package: auth store, Apollo client, 6 GraphQL query/mutation files, codegen, RadarChart/LoadingState/ErrorState/BehaviorBadge components
- Biome 1.9.4 for linting/formatting
- 401 error → clearAuthCallback bridge pattern for Expo Router navigation

## How to test
1. `cd mobile && yarn install`
2. `yarn codegen` — should generate mobile/packages/shared/graphql/generated/graphql.ts
3. `yarn test` — all shared package tests pass

## Release Notes
Internal infrastructure only — no user-facing changes.
EOF
)"
```

---

## Chunk 2: Parent App

> **PR 2:** `feature/react-native-parent-app` → main (after PR 1 merged)

### Task 8: Parent app scaffold

**Files:**
- Create: `mobile/apps/parent/app.json`
- Create: `mobile/apps/parent/package.json`
- Create: `mobile/apps/parent/tsconfig.json`
- Create: `mobile/apps/parent/.env`
- Create: `mobile/apps/parent/.env.production`

- [ ] **Step 1: Create branch from updated main**

```bash
rtk git checkout main && rtk git pull
rtk git checkout -b feature/react-native-parent-app
```

- [ ] **Step 2: Create `mobile/apps/parent/app.json`**

```json
{
  "expo": {
    "name": "GrewMe for Parents",
    "slug": "grewme-parent",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "grewme-parent",
    "ios": {
      "bundleIdentifier": "id.grewme.parent",
      "supportsTablet": false
    },
    "android": {
      "package": "id.grewme.parent",
      "adaptiveIcon": {
        "backgroundColor": "#6366f1"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 3: Create `mobile/apps/parent/package.json`**

```json
{
  "name": "@grewme/parent",
  "version": "0.0.1",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "test": "jest --passWithNoTests"
  },
  "dependencies": {
    "@grewme/shared": "*",
    "@apollo/client": "^3.11.0",
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "graphql": "^16.9.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-svg": "^15.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "typescript": "^5.6.0",
    "jest": "^29.0.0",
    "@testing-library/react-native": "^12.0.0",
    "jest-expo": "~52.0.0"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/react-native/extend-expect"]
  }
}
```

- [ ] **Step 4: Create `mobile/apps/parent/tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@grewme/shared": ["../../packages/shared/index.ts"]
    }
  }
}
```

- [ ] **Step 5: Create `mobile/apps/parent/.env`**

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

- [ ] **Step 6: Create `mobile/apps/parent/.env.production`**

```
EXPO_PUBLIC_API_URL=https://api.grewme.id
```

- [ ] **Step 7: Install deps**

```bash
cd mobile && yarn install
```

- [ ] **Step 8: Commit scaffold**

```bash
rtk git add mobile/apps/parent/
rtk git commit -m "feat: scaffold parent Expo app"
```

---

### Task 9: Parent app auth screens

**Files:**
- Create: `mobile/apps/parent/app/index.tsx`
- Create: `mobile/apps/parent/app/(auth)/_layout.tsx`
- Create: `mobile/apps/parent/app/(auth)/login.tsx`
- Create: `mobile/apps/parent/app/(app)/_layout.tsx`
- Create: `mobile/apps/parent/app/__tests__/login.test.tsx`

- [ ] **Step 1: Write failing test for login screen**

Create `mobile/apps/parent/app/__tests__/login.test.tsx`:

```typescript
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { MockedProvider } from '@apollo/client/testing'
import { LoginScreen } from '../(auth)/login'
import { LoginDocument } from '@grewme/shared/graphql/generated/graphql'

const loginMock = {
  request: {
    query: LoginDocument,
    variables: { email: 'parent@test.com', password: 'password123', role: 'parent' },
  },
  result: {
    data: {
      login: {
        accessToken: 'jwt-abc',
        refreshToken: 'refresh-xyz',
        user: { __typename: 'Parent', id: '1', name: 'Test Parent', email: 'parent@test.com' },
        errors: [],
      },
    },
  },
}

it('renders email and password fields', () => {
  const { getByPlaceholderText } = render(
    <MockedProvider mocks={[]}>
      <LoginScreen />
    </MockedProvider>
  )
  expect(getByPlaceholderText('Email')).toBeTruthy()
  expect(getByPlaceholderText('Password')).toBeTruthy()
})

it('calls login mutation on submit and stores token', async () => {
  const { getByPlaceholderText, getByText } = render(
    <MockedProvider mocks={[loginMock]} addTypename={false}>
      <LoginScreen />
    </MockedProvider>
  )
  fireEvent.changeText(getByPlaceholderText('Email'), 'parent@test.com')
  fireEvent.changeText(getByPlaceholderText('Password'), 'password123')
  fireEvent.press(getByText('Sign in'))
  await waitFor(() => {
    const { useAuthStore } = require('@grewme/shared')
    expect(useAuthStore.getState().token).toBe('jwt-abc')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd mobile/apps/parent && yarn test app/__tests__/login.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Create `mobile/apps/parent/app/index.tsx`**

Auth redirect — checks token on mount and routes accordingly.

```typescript
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { useAuthStore } from '@grewme/shared'
import { LoadingState } from '@grewme/shared'

export default function Index() {
  const [hydrated, setHydrated] = useState(false)
  const token = useAuthStore((s) => s.token)
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    SecureStore.getItemAsync('auth_token').then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored)
        setAuth(parsed.token, parsed.userType)
      }
      setHydrated(true)
    })
  }, [setAuth])

  if (!hydrated) return <LoadingState />
  if (token) return <Redirect href="/(app)/children" />
  return <Redirect href="/(auth)/login" />
}
```

- [ ] **Step 4: Create `mobile/apps/parent/app/(auth)/_layout.tsx`**

```typescript
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Step 5: Create `mobile/apps/parent/app/(auth)/login.tsx`**

```typescript
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import { useAuthStore, useLoginMutation } from '@grewme/shared'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [login, { loading }] = useLoginMutation()

  async function handleSubmit() {
    const result = await login({ variables: { email, password, role: 'parent' } })
    const data = result.data?.login
    if (!data) return

    if (data.errors?.length) {
      Alert.alert('Login failed', data.errors[0].message)
      return
    }

    const token = data.accessToken
    const typename = data.user?.__typename

    if (typename !== 'Parent') {
      Alert.alert('Error', 'This account type is not supported in this app.')
      return
    }

    await SecureStore.setItemAsync('auth_token', JSON.stringify({ token, userType: 'parent' }))
    setAuth(token!, 'parent')
    router.replace('/(app)/children')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GrewMe for Parents</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
      </TouchableOpacity>
    </View>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 32, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
```

- [ ] **Step 6: Create `mobile/apps/parent/app/(app)/_layout.tsx`**

```typescript
import { Stack, useRouter } from 'expo-router'
import { ApolloProvider } from '@apollo/client'
import { useEffect } from 'react'
import { apolloClient, clearAuthCallback } from '@grewme/shared'

export default function AppLayout() {
  const router = useRouter()

  useEffect(() => {
    clearAuthCallback.current = () => router.replace('/(auth)/login')
    return () => { clearAuthCallback.current = null }
  }, [router])

  return (
    <ApolloProvider client={apolloClient}>
      <Stack screenOptions={{ headerShown: true }} />
    </ApolloProvider>
  )
}
```

- [ ] **Step 7: Run login tests**

```bash
cd mobile/apps/parent && yarn test app/__tests__/login.test.tsx
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
rtk git add mobile/apps/parent/app/
rtk git commit -m "feat: add parent app auth screens and navigation layout"
```

---

### Task 10: Children list screen

**Files:**
- Create: `mobile/apps/parent/app/(app)/children/index.tsx`
- Create: `mobile/apps/parent/app/(app)/children/__tests__/index.test.tsx`

- [ ] **Step 1: Write failing test**

Create `mobile/apps/parent/app/(app)/children/__tests__/index.test.tsx`:

```typescript
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { MockedProvider } from '@apollo/client/testing'
import ChildrenScreen from '../index'
import { MyChildrenDocument } from '@grewme/shared/graphql/generated/graphql'

const mock = {
  request: { query: MyChildrenDocument },
  result: {
    data: {
      myChildren: [
        { id: '1', name: 'Budi Santoso', classrooms: [{ id: 'c1', name: 'Class 1A' }] },
        { id: '2', name: 'Sari Dewi', classrooms: [{ id: 'c2', name: 'Class 2B' }] },
      ],
    },
  },
}

it('renders children names after loading', async () => {
  const { getByText } = render(
    <MockedProvider mocks={[mock]} addTypename={false}>
      <ChildrenScreen />
    </MockedProvider>
  )
  await waitFor(() => {
    expect(getByText('Budi Santoso')).toBeTruthy()
    expect(getByText('Sari Dewi')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd mobile/apps/parent && yarn test app/__tests__/children.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Create `mobile/apps/parent/app/(app)/children/index.tsx`**

```typescript
import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useMyChildrenQuery } from '@grewme/shared'
import { LoadingState } from '@grewme/shared'
import { ErrorState } from '@grewme/shared'

export default function ChildrenScreen() {
  const router = useRouter()
  const { data, loading, error, refetch } = useMyChildrenQuery()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.myChildren}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/children/${item.id}/radar`)}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.classroom}>{item.classrooms[0]?.name}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: '600', color: '#111827' },
  classroom: { fontSize: 14, color: '#6b7280', marginTop: 4 },
})
```

- [ ] **Step 4: Run test**

```bash
cd mobile/apps/parent && yarn test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add mobile/apps/parent/app/(app)/children/
rtk git commit -m "feat: add parent children list screen"
```

---

### Task 11: Child detail tabs + Radar screen

**Files:**
- Create: `mobile/apps/parent/app/(app)/children/[id]/_layout.tsx`
- Create: `mobile/apps/parent/app/(app)/children/[id]/radar.tsx`
- Create: `mobile/apps/parent/app/(app)/children/[id]/__tests__/radar.test.tsx`

- [ ] **Step 1: Write failing test for radar screen**

Create `mobile/apps/parent/app/(app)/children/[id]/__tests__/radar.test.tsx`:

```typescript
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { MockedProvider } from '@apollo/client/testing'
import RadarScreen from '../radar'
import { StudentRadarDocument } from '@grewme/shared/graphql/generated/graphql'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'student-1' }),
}))

const mock = {
  request: { query: StudentRadarDocument, variables: { studentId: 'student-1' } },
  result: {
    data: {
      studentRadar: {
        studentId: 'student-1',
        studentName: 'Budi Santoso',
        skills: { reading: 80, math: 70, writing: 60, logic: 75, social: 85 },
      },
    },
  },
}

it('renders student name and radar chart', async () => {
  const { getByText, getByTestId } = render(
    <MockedProvider mocks={[mock]} addTypename={false}>
      <RadarScreen />
    </MockedProvider>
  )
  await waitFor(() => {
    expect(getByText('Budi Santoso')).toBeTruthy()
    expect(getByTestId('radar-chart')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd mobile/apps/parent && yarn test
```

Expected: FAIL

- [ ] **Step 3: Create `mobile/apps/parent/app/(app)/children/[id]/_layout.tsx`**

```typescript
import { Tabs } from 'expo-router'

export default function ChildDetailLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="radar" options={{ title: 'Radar' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
    </Tabs>
  )
}
```

- [ ] **Step 4: Create `mobile/apps/parent/app/(app)/children/[id]/radar.tsx`**

```typescript
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useStudentRadarQuery, RadarChart, LoadingState, ErrorState } from '@grewme/shared'

export default function RadarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, loading, error, refetch } = useStudentRadarQuery({
    variables: { studentId: id },
  })

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const radar = data?.studentRadar
  if (!radar) return null

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{radar.studentName}</Text>
      <RadarChart skills={radar.skills} size={280} />
      <View style={styles.scores}>
        {Object.entries(radar.skills).map(([key, val]) => (
          <View key={key} style={styles.scoreRow}>
            <Text style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
            <Text style={styles.value}>{val ?? '—'}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 24 },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  scores: { width: '100%', marginTop: 24 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  label: { fontSize: 15, color: '#374151' },
  value: { fontSize: 15, fontWeight: '600', color: '#6366f1' },
})
```

- [ ] **Step 5: Run test**

```bash
cd mobile/apps/parent && yarn test
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
rtk git add mobile/apps/parent/app/(app)/children/[id]/
rtk git commit -m "feat: add child detail tab layout and radar screen"
```

---

### Task 12: Child progress screen

**Files:**
- Create: `mobile/apps/parent/app/(app)/children/[id]/progress.tsx`
- Create: `mobile/apps/parent/app/(app)/children/[id]/__tests__/progress.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { MockedProvider } from '@apollo/client/testing'
import ProgressScreen from '../progress'
import { StudentProgressDocument } from '@grewme/shared/graphql/generated/graphql'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'student-1' }),
}))

const mock = {
  request: { query: StudentProgressDocument, variables: { studentId: 'student-1' } },
  result: {
    data: {
      studentProgress: {
        weeks: [
          { period: 'Week of Mar 24', skills: { reading: 70, math: 65, writing: 55, logic: 60, social: 75 } },
          { period: 'Week of Mar 31', skills: { reading: 75, math: 70, writing: 60, logic: 65, social: 80 } },
        ],
      },
    },
  },
}

it('renders week labels', async () => {
  const { getByText } = render(
    <MockedProvider mocks={[mock]} addTypename={false}>
      <ProgressScreen />
    </MockedProvider>
  )
  await waitFor(() => {
    expect(getByText('Week of Mar 24')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Create `mobile/apps/parent/app/(app)/children/[id]/progress.tsx`**

Render weekly skills as a simple tabular view (line charts require an additional library — keep it simple for v1 using `View` rows):

```typescript
import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useStudentProgressQuery, LoadingState, ErrorState } from '@grewme/shared'

const SKILLS = ['reading', 'math', 'writing', 'logic', 'social'] as const

export default function ProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, loading, error, refetch } = useStudentProgressQuery({
    variables: { studentId: id },
  })

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const weeks = data?.studentProgress?.weeks ?? []

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Weekly Progress</Text>
      {weeks.map((week) => (
        <View key={week.period} style={styles.weekCard}>
          <Text style={styles.period}>{week.period}</Text>
          {SKILLS.map((skill) => (
            <View key={skill} style={styles.skillRow}>
              <Text style={styles.skillName}>{skill.charAt(0).toUpperCase() + skill.slice(1)}</Text>
              <Text style={styles.skillValue}>{week.skills[skill] ?? '—'}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  weekCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  period: { fontSize: 14, fontWeight: '600', color: '#6366f1', marginBottom: 8 },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  skillName: { fontSize: 14, color: '#374151' },
  skillValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
})
```

- [ ] **Step 4: Run test**

```bash
cd mobile/apps/parent && yarn test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add mobile/apps/parent/app/(app)/children/[id]/progress.tsx
rtk git commit -m "feat: add child progress screen (weekly skills)"
```

---

### Task 13: Child history screen and PR 2

**Files:**
- Create: `mobile/apps/parent/app/(app)/children/[id]/history.tsx`
- Create: `mobile/apps/parent/app/(app)/children/[id]/__tests__/history.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { MockedProvider } from '@apollo/client/testing'
import HistoryScreen from '../history'
import { StudentDailyScoresDocument } from '@grewme/shared/graphql/generated/graphql'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'student-1' }),
}))

const mock = {
  request: {
    query: StudentDailyScoresDocument,
    variables: { studentId: 'student-1', skillCategory: undefined, first: 20, after: undefined },
  },
  result: {
    data: {
      studentDailyScores: {
        nodes: [
          { id: '1', date: '2026-04-01', skillCategory: 'reading', score: 85, notes: null, teacher: { id: 't1', name: 'Ms. Ayu' } },
        ],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
  },
}

it('renders score entries', async () => {
  const { getByText } = render(
    <MockedProvider mocks={[mock]} addTypename={false}>
      <HistoryScreen />
    </MockedProvider>
  )
  await waitFor(() => {
    expect(getByText('85')).toBeTruthy()
    expect(getByText('Reading')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Create `mobile/apps/parent/app/(app)/children/[id]/history.tsx`**

```typescript
import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useStudentDailyScoresQuery, LoadingState, ErrorState } from '@grewme/shared'

export default function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, loading, error, refetch, fetchMore } = useStudentDailyScoresQuery({
    variables: { studentId: id, first: 20 },
  })

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const nodes = data?.studentDailyScores?.nodes ?? []
  const pageInfo = data?.studentDailyScores?.pageInfo

  function loadMore() {
    if (!pageInfo?.hasNextPage) return
    fetchMore({ variables: { after: pageInfo.endCursor } })
  }

  return (
    <FlatList
      data={nodes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.skill}>
              {item.skillCategory.charAt(0).toUpperCase() + item.skillCategory.slice(1)}
            </Text>
            <Text style={styles.score}>{item.score}</Text>
          </View>
          <Text style={styles.date}>{item.date}</Text>
          {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
          <Text style={styles.teacher}>Recorded by {item.teacher.name}</Text>
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skill: { fontSize: 16, fontWeight: '600', color: '#111827' },
  score: { fontSize: 22, fontWeight: '700', color: '#6366f1' },
  date: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  notes: { fontSize: 14, color: '#374151', marginTop: 6 },
  teacher: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
})
```

- [ ] **Step 4: Run all parent app tests**

```bash
cd mobile/apps/parent && yarn test
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
rtk git add mobile/apps/parent/app/(app)/children/[id]/history.tsx
rtk git commit -m "feat: add child score history screen with infinite scroll"
```

- [ ] **Step 6: Open PR 2**

```bash
rtk git push -u origin feature/react-native-parent-app
gh pr create \
  --title "feat: React Native parent app (5 screens)" \
  --body "$(cat <<'EOF'
## Overview
Adds the GrewMe for Parents React Native app with 5 screens: login, children list, and child detail (radar, progress, history tabs).

## Features & Fixes
- Expo Router file-based navigation with auth guard
- Token hydration from expo-secure-store on startup
- Children list backed by myChildren GraphQL query
- Child radar chart using shared RadarChart component
- Weekly skill progress (5 weeks, tabular view)
- Score history with graphql-ruby connection pagination (infinite scroll)

## How to test
1. `cd mobile/apps/parent && yarn ios`
2. Log in with a parent account (backend must be running at localhost:3000)
3. Navigate through children list → child detail tabs

## Release Notes
New GrewMe for Parents iOS app (id.grewme.parent). Not yet submitted to App Store.
EOF
)"
```

---

## Chunk 3: Teacher App

> **PR 3:** `feature/react-native-teacher-app` → main (after PR 1 merged)

### Task 14: Teacher app scaffold

**Files:**
- Create: `mobile/apps/teacher/app.json`
- Create: `mobile/apps/teacher/package.json`
- Create: `mobile/apps/teacher/tsconfig.json`
- Create: `mobile/apps/teacher/.env`

- [ ] **Step 1: Create branch from updated main**

```bash
rtk git checkout main && rtk git pull
rtk git checkout -b feature/react-native-teacher-app
```

- [ ] **Step 2: Create `mobile/apps/teacher/app.json`**

```json
{
  "expo": {
    "name": "GrewMe for Teachers",
    "slug": "grewme-teacher",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "grewme-teacher",
    "ios": {
      "bundleIdentifier": "id.grewme.teacher",
      "supportsTablet": true
    },
    "android": {
      "package": "id.grewme.teacher",
      "adaptiveIcon": {
        "backgroundColor": "#059669"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 3: Create `mobile/apps/teacher/package.json`** (same structure as parent, different name/accent color)

```json
{
  "name": "@grewme/teacher",
  "version": "0.0.1",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "test": "jest --passWithNoTests"
  },
  "dependencies": {
    "@grewme/shared": "*",
    "@apollo/client": "^3.11.0",
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "graphql": "^16.9.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-svg": "^15.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "typescript": "^5.6.0",
    "jest": "^29.0.0",
    "@testing-library/react-native": "^12.0.0",
    "jest-expo": "~52.0.0"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/react-native/extend-expect"]
  }
}
```

- [ ] **Step 4: Create `mobile/apps/teacher/tsconfig.json`** (same as parent)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@grewme/shared": ["../../packages/shared/index.ts"]
    }
  }
}
```

- [ ] **Step 5: Create `mobile/apps/teacher/.env`**

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

- [ ] **Step 6: Install and commit**

```bash
cd mobile && yarn install
rtk git add mobile/apps/teacher/
rtk git commit -m "feat: scaffold teacher Expo app"
```

---

### Task 15: Teacher auth screens

Same pattern as parent — login calls `role: "teacher"`, userType `'Teacher'` normalized to `'teacher'`, redirects to `/(app)/`.

**Files:**
- Create: `mobile/apps/teacher/app/index.tsx`
- Create: `mobile/apps/teacher/app/(auth)/_layout.tsx`
- Create: `mobile/apps/teacher/app/(auth)/login.tsx`
- Create: `mobile/apps/teacher/app/(app)/_layout.tsx`
- Create: `mobile/apps/teacher/app/__tests__/login.test.tsx`

- [ ] **Step 1: Write failing test for teacher login**

```typescript
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { MockedProvider } from '@apollo/client/testing'
import { LoginScreen } from '../(auth)/login'
import { LoginDocument } from '@grewme/shared/graphql/generated/graphql'

const mock = {
  request: {
    query: LoginDocument,
    variables: { email: 'teacher@test.com', password: 'pass', role: 'teacher' },
  },
  result: {
    data: {
      login: {
        accessToken: 'jwt-teacher',
        refreshToken: 'refresh',
        user: { __typename: 'Teacher', id: '1', name: 'Ms. Ayu', email: 'teacher@test.com' },
        errors: [],
      },
    },
  },
}

it('logs in as teacher and stores token', async () => {
  const { getByPlaceholderText, getByText } = render(
    <MockedProvider mocks={[mock]} addTypename={false}>
      <LoginScreen />
    </MockedProvider>
  )
  fireEvent.changeText(getByPlaceholderText('Email'), 'teacher@test.com')
  fireEvent.changeText(getByPlaceholderText('Password'), 'pass')
  fireEvent.press(getByText('Sign in'))
  await waitFor(() => {
    const { useAuthStore } = require('@grewme/shared')
    expect(useAuthStore.getState().token).toBe('jwt-teacher')
    expect(useAuthStore.getState().userType).toBe('teacher')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Create auth files** — same structure as parent auth, but:
  - `role: 'teacher'` in the login mutation call
  - `typename !== 'Teacher'` guard
  - Redirect to `/(app)/` (dashboard) on success
  - `setAuth(token, 'teacher')`

Follow the same file structure as Task 9 steps 3–6. The `(app)/_layout.tsx` is identical.

- [ ] **Step 4: Run test**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add mobile/apps/teacher/app/
rtk git commit -m "feat: add teacher app auth screens"
```

---

### Task 16: Teacher dashboard

**Files:**
- Create: `mobile/apps/teacher/app/(app)/index.tsx`
- Create: `mobile/apps/teacher/app/(app)/__tests__/dashboard.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { MockedProvider } from '@apollo/client/testing'
import DashboardScreen from '../index'
import { ClassroomsDocument, ClassroomBehaviorTodayDocument } from '@grewme/shared/graphql/generated/graphql'

const classroomsMock = {
  request: { query: ClassroomsDocument },
  result: { data: { classrooms: [{ id: 'c1', name: 'Class 1A', school: { id: 's1' } }] } },
}

const behaviorMock = {
  request: { query: ClassroomBehaviorTodayDocument, variables: { classroomId: 'c1' } },
  result: {
    data: {
      classroomBehaviorToday: [
        { student: { id: 'st1', name: 'Budi' }, totalPoints: 10, positiveCount: 2, negativeCount: 0, recentPoints: [] },
      ],
    },
  },
}

it('renders classroom name and student behavior', async () => {
  const { getByText } = render(
    <MockedProvider mocks={[classroomsMock, behaviorMock]} addTypename={false}>
      <DashboardScreen />
    </MockedProvider>
  )
  await waitFor(() => {
    expect(getByText('Class 1A')).toBeTruthy()
    expect(getByText('Budi')).toBeTruthy()
    expect(getByText('10')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Create `mobile/apps/teacher/app/(app)/index.tsx`**

```typescript
import React, { useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native'
import {
  useClassroomsQuery,
  useClassroomBehaviorTodayQuery,
  useAuthStore,
  LoadingState,
  ErrorState,
} from '@grewme/shared'

export default function DashboardScreen() {
  const setActiveClassroomId = useAuthStore((s) => s.setActiveClassroomId)
  const setActiveSchoolId = useAuthStore((s) => s.setActiveSchoolId)
  const activeClassroomId = useAuthStore((s) => s.activeClassroomId)

  const { data: classroomsData, loading: classroomsLoading } = useClassroomsQuery()

  useEffect(() => {
    const first = classroomsData?.classrooms?.[0]
    if (first) {
      setActiveClassroomId(first.id)
      setActiveSchoolId(first.school.id)
    }
  }, [classroomsData, setActiveClassroomId, setActiveSchoolId])

  const { data: behaviorData, loading: behaviorLoading, error } = useClassroomBehaviorTodayQuery({
    variables: { classroomId: activeClassroomId! },
    skip: !activeClassroomId,
  })

  if (classroomsLoading || behaviorLoading) return <LoadingState />
  if (error) return <ErrorState message={error.message} />

  const classroom = classroomsData?.classrooms?.[0]
  const students = behaviorData?.classroomBehaviorToday ?? []

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{classroom?.name}</Text>
      <Text style={styles.subtitle}>Today's Behavior</Text>
      {students.map((entry) => (
        <View key={entry.student.id} style={styles.card}>
          <Text style={styles.studentName}>{entry.student.name}</Text>
          <Text style={styles.points}>{entry.totalPoints} pts</Text>
          <Text style={styles.counts}>
            +{entry.positiveCount} / -{entry.negativeCount}
          </Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  studentName: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  points: { fontSize: 20, fontWeight: '700', color: '#059669' },
  counts: { fontSize: 13, color: '#6b7280', marginLeft: 8 },
})
```

- [ ] **Step 4: Run test**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add mobile/apps/teacher/app/(app)/index.tsx
rtk git commit -m "feat: add teacher dashboard with classroom behavior summary"
```

---

### Task 17: Class overview screen

**Files:**
- Create: `mobile/apps/teacher/app/(app)/students/index.tsx`
- Create: `mobile/apps/teacher/app/(app)/students/__tests__/index.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { MockedProvider } from '@apollo/client/testing'
import StudentsScreen from '../index'
import { ClassroomOverviewDocument } from '@grewme/shared/graphql/generated/graphql'
import { useAuthStore } from '@grewme/shared'

beforeEach(() => {
  useAuthStore.setState({ ...useAuthStore.getState(), activeClassroomId: 'c1' })
})

const mock = {
  request: { query: ClassroomOverviewDocument, variables: { classroomId: 'c1' } },
  result: {
    data: {
      classroomOverview: {
        classroomId: 'c1',
        classroomName: 'Class 1A',
        students: [{ studentId: 'st1', studentName: 'Budi', skills: { reading: 80, math: 70, writing: 60, logic: 75, social: 85 } }],
      },
    },
  },
}

it('renders student names with radar charts', async () => {
  const { getByText } = render(
    <MockedProvider mocks={[mock]} addTypename={false}>
      <StudentsScreen />
    </MockedProvider>
  )
  await waitFor(() => {
    expect(getByText('Budi')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Create `mobile/apps/teacher/app/(app)/students/index.tsx`**

```typescript
import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useClassroomOverviewQuery, useAuthStore, RadarChart, LoadingState, ErrorState } from '@grewme/shared'

export default function StudentsScreen() {
  const router = useRouter()
  const activeClassroomId = useAuthStore((s) => s.activeClassroomId)
  const { data, loading, error, refetch } = useClassroomOverviewQuery({
    variables: { classroomId: activeClassroomId! },
    skip: !activeClassroomId,
  })

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const students = data?.classroomOverview?.students ?? []

  return (
    <FlatList
      data={students}
      keyExtractor={(item) => item.studentId}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push({ pathname: '/(app)/behavior', params: { studentId: item.studentId } })}
        >
          <Text style={styles.name}>{item.studentName}</Text>
          <RadarChart skills={item.skills} size={120} />
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
})
```

- [ ] **Step 4: Run test**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add mobile/apps/teacher/app/(app)/students/
rtk git commit -m "feat: add class overview screen with per-student radar charts"
```

---

### Task 18: Award behavior screen

**Files:**
- Create: `mobile/apps/teacher/app/(app)/behavior/index.tsx`
- Create: `mobile/apps/teacher/app/(app)/behavior/__tests__/index.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react-native'
import { MockedProvider } from '@apollo/client/testing'
import BehaviorScreen from '../index'
import { BehaviorCategoriesDocument, AwardBehaviorPointDocument } from '@grewme/shared/graphql/generated/graphql'
import { useAuthStore } from '@grewme/shared'

beforeEach(() => {
  useAuthStore.setState({ ...useAuthStore.getState(), activeClassroomId: 'c1', activeSchoolId: 's1' })
})

const categoriesMock = {
  request: { query: BehaviorCategoriesDocument, variables: { schoolId: 's1' } },
  result: {
    data: {
      behaviorCategories: [
        { id: 'bc1', name: 'Helping Others', description: '', pointValue: 5, isPositive: true, icon: '🤝', color: '#16a34a', position: 1 },
      ],
    },
  },
}

it('renders category name after loading', async () => {
  const { getByText } = render(
    <MockedProvider mocks={[categoriesMock]} addTypename={false}>
      <BehaviorScreen />
    </MockedProvider>
  )
  await waitFor(() => {
    expect(getByText('Helping Others')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Create `mobile/apps/teacher/app/(app)/behavior/index.tsx`**

```typescript
import React, { useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import {
  useBehaviorCategoriesQuery,
  useAwardBehaviorPointMutation,
  useAuthStore,
  BehaviorBadge,
  LoadingState,
  ErrorState,
} from '@grewme/shared'

export default function BehaviorScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>()
  const [note, setNote] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const activeSchoolId = useAuthStore((s) => s.activeSchoolId)
  const activeClassroomId = useAuthStore((s) => s.activeClassroomId)

  const { data, loading, error } = useBehaviorCategoriesQuery({
    variables: { schoolId: activeSchoolId! },
    skip: !activeSchoolId,
  })

  const [awardPoint, { loading: awarding }] = useAwardBehaviorPointMutation()

  async function handleAward() {
    if (!selectedCategoryId || !activeClassroomId || !studentId) return
    const result = await awardPoint({
      variables: {
        studentId,
        classroomId: activeClassroomId,
        behaviorCategoryId: selectedCategoryId,
        note: note || undefined,
      },
    })
    const res = result.data?.awardBehaviorPoint
    if (res?.errors?.length) {
      Alert.alert('Error', res.errors[0].message)
      return
    }
    Alert.alert('Success', `Point awarded! Daily total: ${res?.dailyTotal}`)
    setNote('')
    setSelectedCategoryId(null)
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error.message} />

  const categories = data?.behaviorCategories ?? []

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Award Behavior Point</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedCategoryId(item.id)}
            style={[styles.categoryRow, selectedCategoryId === item.id && styles.selected]}
          >
            <BehaviorBadge
              name={item.name}
              pointValue={item.pointValue}
              isPositive={item.isPositive}
              color={item.color}
            />
          </TouchableOpacity>
        )}
      />
      <TextInput
        style={styles.noteInput}
        placeholder="Optional note..."
        value={note}
        onChangeText={setNote}
        multiline
      />
      <TouchableOpacity
        style={[styles.button, (!selectedCategoryId || awarding) && styles.buttonDisabled]}
        onPress={handleAward}
        disabled={!selectedCategoryId || awarding}
      >
        <Text style={styles.buttonText}>{awarding ? 'Awarding...' : 'Award'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  heading: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  categoryRow: { borderRadius: 8, marginBottom: 4 },
  selected: { backgroundColor: '#ede9fe' },
  noteInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginVertical: 16, minHeight: 64 },
  button: { backgroundColor: '#059669', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#9ca3af' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
```

- [ ] **Step 4: Run test**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add mobile/apps/teacher/app/(app)/behavior/index.tsx
rtk git commit -m "feat: add award behavior point screen"
```

---

### Task 19: Behavior history screen

**Files:**
- Create: `mobile/apps/teacher/app/(app)/behavior/history.tsx`
- Create: `mobile/apps/teacher/app/(app)/behavior/__tests__/history.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { MockedProvider } from '@apollo/client/testing'
import BehaviorHistoryScreen from '../history'
import { StudentBehaviorHistoryDocument } from '@grewme/shared/graphql/generated/graphql'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ studentId: 'st1' }),
}))

const mock = {
  request: { query: StudentBehaviorHistoryDocument, variables: { studentId: 'st1', startDate: undefined, endDate: undefined } },
  result: {
    data: {
      studentBehaviorHistory: [
        {
          id: 'bp1',
          pointValue: 5,
          note: 'Great job!',
          awardedAt: '2026-04-01T10:00:00Z',
          revokable: true,
          teacher: { id: 't1', name: 'Ms. Ayu' },
          behaviorCategory: { name: 'Helping Others', isPositive: true, icon: '🤝', color: '#16a34a' },
        },
      ],
    },
  },
}

it('renders behavior history entries', async () => {
  const { getByText } = render(
    <MockedProvider mocks={[mock]} addTypename={false}>
      <BehaviorHistoryScreen />
    </MockedProvider>
  )
  await waitFor(() => {
    expect(getByText('Helping Others')).toBeTruthy()
    expect(getByText('+5')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Create `mobile/apps/teacher/app/(app)/behavior/history.tsx`**

```typescript
import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useStudentBehaviorHistoryQuery, LoadingState, ErrorState } from '@grewme/shared'

export default function BehaviorHistoryScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>()
  const { data, loading, error, refetch } = useStudentBehaviorHistoryQuery({
    variables: { studentId },
  })

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const history = data?.studentBehaviorHistory ?? []

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.category}>{item.behaviorCategory.name}</Text>
            <Text style={[styles.points, { color: item.behaviorCategory.isPositive ? '#16a34a' : '#dc2626' }]}>
              {item.behaviorCategory.isPositive ? '+' : ''}{item.pointValue}
            </Text>
          </View>
          {item.note && <Text style={styles.note}>{item.note}</Text>}
          <Text style={styles.meta}>
            {new Date(item.awardedAt).toLocaleDateString()} · {item.teacher.name}
          </Text>
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 16, fontWeight: '600', color: '#111827' },
  points: { fontSize: 18, fontWeight: '700' },
  note: { fontSize: 14, color: '#374151', marginTop: 6 },
  meta: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
})
```

- [ ] **Step 4: Run test**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add mobile/apps/teacher/app/(app)/behavior/history.tsx
rtk git commit -m "feat: add student behavior history screen"
```

---

### Task 20: Record health checkup screen and PR 3

**Files:**
- Create: `mobile/apps/teacher/app/(app)/health/index.tsx`
- Create: `mobile/apps/teacher/app/(app)/health/__tests__/index.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import React from 'react'
import { render } from '@testing-library/react-native'
import { MockedProvider } from '@apollo/client/testing'
import HealthScreen from '../index'
import { ClassroomOverviewDocument } from '@grewme/shared/graphql/generated/graphql'
import { useAuthStore } from '@grewme/shared'

beforeEach(() => {
  useAuthStore.setState({ ...useAuthStore.getState(), activeClassroomId: 'c1' })
})

const overviewMock = {
  request: { query: ClassroomOverviewDocument, variables: { classroomId: 'c1' } },
  result: {
    data: {
      classroomOverview: {
        students: [{ id: 'st1', name: 'Budi' }],
        radarData: [],
      },
    },
  },
}

it('renders student picker and form fields', async () => {
  const { getByText } = render(
    <MockedProvider mocks={[overviewMock]} addTypename={false}>
      <HealthScreen />
    </MockedProvider>
  )
  await waitFor(() => {
    expect(getByText('Budi')).toBeTruthy()
    expect(getByText('Record Health Checkup')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Create `mobile/apps/teacher/app/(app)/health/index.tsx`**

```typescript
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import {
  useClassroomOverviewQuery,
  useCreateHealthCheckupMutation,
  useAuthStore,
  LoadingState,
  ErrorState,
} from '@grewme/shared'

export default function HealthScreen() {
  const activeClassroomId = useAuthStore((s) => s.activeClassroomId)
  const { data, loading, error } = useClassroomOverviewQuery({
    variables: { classroomId: activeClassroomId! },
    skip: !activeClassroomId,
  })

  const [studentId, setStudentId] = useState<string>('')
  const [measuredAt, setMeasuredAt] = useState(new Date().toISOString().split('T')[0])
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [headCm, setHeadCm] = useState('')
  const [notes, setNotes] = useState('')

  const [createCheckup, { loading: saving }] = useCreateHealthCheckupMutation()

  async function handleSubmit() {
    if (!studentId || !measuredAt) {
      Alert.alert('Error', 'Student and date are required.')
      return
    }
    const result = await createCheckup({
      variables: {
        studentId,
        measuredAt,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        headCircumferenceCm: headCm ? parseFloat(headCm) : undefined,
        notes: notes || undefined,
      },
    })
    const res = result.data?.createHealthCheckup
    if (res?.errors?.length) {
      Alert.alert('Error', res.errors[0].message)
      return
    }
    Alert.alert('Success', `Checkup recorded. BMI: ${res?.healthCheckup?.bmi ?? '—'}`)
    setWeightKg(''); setHeightCm(''); setHeadCm(''); setNotes('')
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error.message} />

  const students = data?.classroomOverview?.students ?? []

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Record Health Checkup</Text>

      <Text style={styles.label}>Student *</Text>
      <Picker selectedValue={studentId} onValueChange={setStudentId} style={styles.picker}>
        <Picker.Item label="Select student..." value="" />
        {students.map((s) => (
          <Picker.Item key={s.id} label={s.name} value={s.id} />
        ))}
      </Picker>

      <Text style={styles.label}>Date *</Text>
      <TextInput style={styles.input} value={measuredAt} onChangeText={setMeasuredAt} placeholder="YYYY-MM-DD" />

      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput style={styles.input} value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" placeholder="e.g. 35.5" />

      <Text style={styles.label}>Height (cm)</Text>
      <TextInput style={styles.input} value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" placeholder="e.g. 130.0" />

      <Text style={styles.label}>Head Circumference (cm)</Text>
      <TextInput style={styles.input} value={headCm} onChangeText={setHeadCm} keyboardType="decimal-pad" placeholder="e.g. 52.0" />

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.multiline]} value={notes} onChangeText={setNotes} multiline placeholder="Optional..." />

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Checkup'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9fafb' },
  heading: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, backgroundColor: '#fff', fontSize: 15 },
  multiline: { minHeight: 80 },
  picker: { backgroundColor: '#fff', borderRadius: 8 },
  button: { backgroundColor: '#059669', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { backgroundColor: '#9ca3af' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
```

Add `@react-native-picker/picker` to teacher's `package.json` dependencies.

- [ ] **Step 4: Run all teacher app tests**

```bash
cd mobile/apps/teacher && yarn test
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
rtk git add mobile/apps/teacher/app/(app)/health/
rtk git commit -m "feat: add health checkup recording screen"
```

- [ ] **Step 6: Open PR 3**

```bash
rtk git push -u origin feature/react-native-teacher-app
gh pr create \
  --title "feat: React Native teacher app (6 screens)" \
  --body "$(cat <<'EOF'
## Overview
Adds the GrewMe for Teachers React Native app with 6 screens: login, dashboard, class overview, award behavior, behavior history, and health checkup recording.

## Features & Fixes
- Teacher login with role-based token storage
- Dashboard: classroom name + today's behavior summary (two-step Apollo query with skip pattern)
- Class overview: all students with radar charts (uses classroomOverview single query, no N+1)
- Award behavior: category picker from behaviorCategories query, 30s cooldown error handling
- Behavior history: per-student history with date filtering capability
- Health checkup: student picker + form with weight, height, head circumference, auto-BMI from backend

## How to test
1. `cd mobile/apps/teacher && yarn ios`
2. Log in with a teacher account
3. Navigate dashboard → class overview → tap student → award behavior
4. Navigate to Health tab → record a checkup

## Release Notes
New GrewMe for Teachers iOS app (id.grewme.teacher). Not yet submitted to App Store.
EOF
)"
```

---

## Post-Implementation Checklist

- [ ] Verify `yarn codegen` generates all expected hooks (`useMyChildrenQuery`, `useLoginMutation`, `useAwardBehaviorPointMutation`, etc.)
- [ ] Verify `classroomOverview` query field names match `ClassroomOverviewType` in backend — adjust `.graphql` and tests if needed
- [ ] Run full test suite: `cd mobile && yarn test`
- [ ] Smoke test parent app on iOS simulator: login → children list → child detail tabs
- [ ] Smoke test teacher app on iOS simulator: login → dashboard → award behavior → health checkup
- [ ] Verify 401 → logout redirect works (expire/invalid token manually)
- [ ] Verify SchoolManager login shows correct error message in both apps
