# SvelteKit Frontend MVP — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the GrewMe SvelteKit frontend with auth, role-based routing, radar charts, and full teacher/parent/admin flows.

**Architecture:** SvelteKit BFF pattern — browser communicates with SvelteKit server via HttpOnly cookies, SvelteKit server proxies GraphQL requests to Rails with JWT Bearer tokens. Separate route groups per role (`/teacher/*`, `/parent/*`, `/admin/*`) with server-side guards.

**Tech Stack:** Svelte 5 (runes), SvelteKit 2.50, Tailwind CSS v4, Chart.js + svelte-chartjs, TypeScript strict mode.

**Design doc:** `docs/plans/2026-03-05-sveltekit-frontend-design.md`

---

## Phase 1: Foundation (Auth + Layout + Tailwind)

### Task 1: Install Tailwind CSS v4

**Files:**
- Modify: `front-end/package.json`
- Create: `front-end/src/app.css`
- Modify: `front-end/src/app.html`

**Step 1: Install Tailwind CSS v4 and the Vite plugin**

Run:
```bash
cd front-end && npm install tailwindcss @tailwindcss/vite
```

**Step 2: Add Tailwind Vite plugin**

Modify `front-end/vite.config.ts`:
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
});
```

**Step 3: Create app.css with Tailwind import and theme**

Create `front-end/src/app.css`:
```css
@import 'tailwindcss';

@theme {
  --color-primary: #3B82F6;
  --color-primary-dark: #2563EB;
  --color-secondary: #8B5CF6;
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-text: #1E293B;
  --color-text-muted: #64748B;

  /* Skill category colors */
  --color-skill-reading: #10B981;
  --color-skill-math: #F59E0B;
  --color-skill-writing: #8B5CF6;
  --color-skill-logic: #06B6D4;
  --color-skill-social: #F43F5E;

  --font-family-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
```

**Step 4: Import app.css in root layout**

Modify `front-end/src/routes/+layout.svelte`:
```svelte
<script>
  import '../app.css';
  let { children } = $props();
</script>

{@render children()}
```

**Step 5: Verify Tailwind works**

Replace `front-end/src/routes/+page.svelte` with:
```svelte
<div class="min-h-screen bg-background flex items-center justify-center">
  <div class="bg-surface rounded-xl shadow-md p-8 text-center">
    <h1 class="text-3xl font-bold text-primary mb-2">GrewMe</h1>
    <p class="text-text-muted">Kids Learning Radar</p>
  </div>
</div>
```

Run: `cd front-end && npm run dev` — verify styled page at http://localhost:5173

**Step 6: Commit**

```bash
git add front-end/
git commit -m "feat(frontend): install Tailwind CSS v4 with custom theme"
```

---

### Task 2: Environment config and GraphQL client

**Files:**
- Create: `front-end/.env`
- Create: `front-end/.env.example`
- Create: `front-end/src/lib/api/client.ts`
- Create: `front-end/src/lib/api/types.ts`

**Step 1: Create environment files**

Create `front-end/.env`:
```
RAILS_GRAPHQL_URL=http://localhost:3000/graphql
COOKIE_SECRET=dev-cookie-secret-change-in-production
PUBLIC_APP_NAME=GrewMe
```

Create `front-end/.env.example`:
```
RAILS_GRAPHQL_URL=http://localhost:3000/graphql
COOKIE_SECRET=change-me
PUBLIC_APP_NAME=GrewMe
```

**Step 2: Create TypeScript types matching GraphQL schema**

Create `front-end/src/lib/api/types.ts`:
```typescript
// === User types ===
export interface Teacher {
  id: string;
  name: string;
  email: string;
  role: 'teacher';
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'parent';
}

export type User = Teacher | Parent;

export interface UserError {
  message: string;
  path: string[];
}

// === Auth ===
export interface AuthPayload {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  user: User | null;
  errors: UserError[];
}

export interface LogoutPayload {
  success: boolean;
  errors: UserError[];
}

// === Classroom ===
export interface Classroom {
  id: string;
  name: string;
  school: { id: string; name: string } | null;
  students: Student[];
  studentCount?: number;
}

// === Student ===
export interface Student {
  id: string;
  name: string;
  classrooms?: Classroom[];
}

// === Daily Score ===
export type SkillCategory = 'READING' | 'MATH' | 'WRITING' | 'LOGIC' | 'SOCIAL';

export interface DailyScore {
  id: string;
  date: string;
  skillCategory: SkillCategory;
  score: number;
  student: { id: string; name: string };
  teacher: { id: string; name: string };
}

// === Radar ===
export interface RadarSkills {
  reading: number | null;
  math: number | null;
  writing: number | null;
  logic: number | null;
  social: number | null;
}

export interface RadarData {
  studentId: string;
  studentName: string;
  skills: RadarSkills;
}

// === Progress ===
export interface ProgressWeek {
  period: string;
  skills: RadarSkills;
}

export interface ProgressData {
  weeks: ProgressWeek[];
}

// === Classroom Overview ===
export interface ClassroomOverviewStudent {
  studentId: string;
  studentName: string;
  skills: RadarSkills;
}

export interface ClassroomOverview {
  classroomId: string;
  classroomName: string;
  students: ClassroomOverviewStudent[];
}

// === Permissions ===
export interface Permission {
  id: string;
  resource: string;
  action: string;
  granted: boolean;
}

export interface EffectivePermission {
  resource: string;
  action: string;
  granted: boolean;
  source: string;
}

export interface UserPermissions {
  userId: string;
  role: string;
  overrides: Permission[];
  effective: EffectivePermission[];
}

// === Pagination (Relay-style) ===
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface Connection<T> {
  nodes: T[];
  pageInfo: PageInfo;
  totalCount?: number;
}

// === Session user (decoded from JWT, stored in locals) ===
export interface SessionUser {
  id: string;
  type: 'Teacher' | 'Parent';
  email: string;
}
```

**Step 3: Create GraphQL client**

Create `front-end/src/lib/api/client.ts`:
```typescript
import { env } from '$env/dynamic/private';

const GRAPHQL_URL = env.RAILS_GRAPHQL_URL || 'http://localhost:3000/graphql';

export class GraphQLError extends Error {
  errors: Array<{ message: string; path?: string[] }>;

  constructor(errors: Array<{ message: string; path?: string[] }>) {
    super(errors.map((e) => e.message).join(', '));
    this.name = 'GraphQLError';
    this.errors = errors;
  }
}

export async function graphql<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new GraphQLError(json.errors);
  }
  return json.data as T;
}
```

**Step 4: Commit**

```bash
git add front-end/
git commit -m "feat(frontend): add GraphQL client, types, and env config"
```

---

### Task 3: GraphQL query/mutation definitions

**Files:**
- Create: `front-end/src/lib/api/queries/auth.ts`
- Create: `front-end/src/lib/api/queries/classrooms.ts`
- Create: `front-end/src/lib/api/queries/students.ts`
- Create: `front-end/src/lib/api/queries/parents.ts`
- Create: `front-end/src/lib/api/queries/permissions.ts`

**Step 1: Auth queries**

Create `front-end/src/lib/api/queries/auth.ts`:
```typescript
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
      }
      ... on Parent {
        id
        name
        email
        phone
      }
    }
  }
`;
```

**Step 2: Classroom queries**

Create `front-end/src/lib/api/queries/classrooms.ts`:
```typescript
export const CLASSROOMS_QUERY = `
  query Classrooms {
    classrooms {
      id
      name
      school {
        id
        name
      }
    }
  }
`;

export const CLASSROOM_QUERY = `
  query Classroom($id: ID!) {
    classroom(id: $id) {
      id
      name
      school {
        id
        name
      }
      students {
        id
        name
      }
    }
  }
`;

export const CLASSROOM_OVERVIEW_QUERY = `
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
`;
```

**Step 3: Student queries**

Create `front-end/src/lib/api/queries/students.ts`:
```typescript
export const STUDENT_QUERY = `
  query Student($id: ID!) {
    student(id: $id) {
      id
      name
    }
  }
`;

export const STUDENT_RADAR_QUERY = `
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
`;

export const STUDENT_PROGRESS_QUERY = `
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
`;

export const STUDENT_DAILY_SCORES_QUERY = `
  query StudentDailyScores($studentId: ID!, $skillCategory: SkillCategory, $first: Int, $after: String) {
    studentDailyScores(studentId: $studentId, skillCategory: $skillCategory, first: $first, after: $after) {
      nodes {
        id
        date
        skillCategory
        score
        student {
          id
          name
        }
        teacher {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const CREATE_DAILY_SCORE_MUTATION = `
  mutation CreateDailyScore($input: CreateDailyScoreInput!) {
    createDailyScore(input: $input) {
      dailyScore {
        id
        date
        skillCategory
        score
      }
      errors {
        message
        path
      }
    }
  }
`;

export const UPDATE_DAILY_SCORE_MUTATION = `
  mutation UpdateDailyScore($input: UpdateDailyScoreInput!) {
    updateDailyScore(input: $input) {
      dailyScore {
        id
        date
        skillCategory
        score
      }
      errors {
        message
        path
      }
    }
  }
`;
```

**Step 4: Parent queries**

Create `front-end/src/lib/api/queries/parents.ts`:
```typescript
export const MY_CHILDREN_QUERY = `
  query MyChildren {
    myChildren {
      id
      name
    }
  }
`;
```

**Step 5: Permission queries**

Create `front-end/src/lib/api/queries/permissions.ts`:
```typescript
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
```

**Step 6: Commit**

```bash
git add front-end/src/lib/api/queries/
git commit -m "feat(frontend): add GraphQL query and mutation definitions"
```

---

### Task 4: Auth BFF proxy (server routes)

**Files:**
- Create: `front-end/src/lib/api/auth.ts` (server-side auth helpers)
- Create: `front-end/src/routes/api/auth/login/+server.ts`
- Create: `front-end/src/routes/api/auth/register/+server.ts`
- Create: `front-end/src/routes/api/auth/refresh/+server.ts`
- Create: `front-end/src/routes/api/auth/logout/+server.ts`
- Create: `front-end/src/routes/api/graphql/+server.ts`

**Step 1: Create auth helpers (cookie management)**

Create `front-end/src/lib/api/auth.ts`:
```typescript
import type { Cookies } from '@sveltejs/kit';
import type { SessionUser } from './types';

const ACCESS_COOKIE = 'grewme_access';
const REFRESH_COOKIE = 'grewme_refresh';
const ROLE_COOKIE = 'grewme_role';

const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: false, // Set to true in production
  sameSite: 'lax' as const
};

export function setAuthCookies(
  cookies: Cookies,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  role: string
): void {
  cookies.set(ACCESS_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: expiresIn
  });
  cookies.set(REFRESH_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
  cookies.set(ROLE_COOKIE, role, {
    ...COOKIE_OPTIONS,
    httpOnly: false, // Client needs to read role for redirects
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAuthCookies(cookies: Cookies): void {
  cookies.delete(ACCESS_COOKIE, { path: '/' });
  cookies.delete(REFRESH_COOKIE, { path: '/' });
  cookies.delete(ROLE_COOKIE, { path: '/' });
}

export function getAccessToken(cookies: Cookies): string | undefined {
  return cookies.get(ACCESS_COOKIE);
}

export function getRefreshToken(cookies: Cookies): string | undefined {
  return cookies.get(REFRESH_COOKIE);
}

export function getRole(cookies: Cookies): string | undefined {
  return cookies.get(ROLE_COOKIE);
}

/**
 * Decode JWT payload without verification (Rails verifies).
 * Used to extract user info for locals.
 */
export function decodeJwtPayload(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.sub,
      type: payload.type,
      email: payload.email || ''
    };
  } catch {
    return null;
  }
}

/**
 * Check if JWT is expired (with 30s buffer for clock skew).
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp * 1000 < Date.now() - 30_000;
  } catch {
    return true;
  }
}
```

**Step 2: Login server route**

Create `front-end/src/routes/api/auth/login/+server.ts`:
```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { graphql } from '$lib/api/client';
import { LOGIN_MUTATION } from '$lib/api/queries/auth';
import { setAuthCookies } from '$lib/api/auth';
import type { AuthPayload } from '$lib/api/types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { email, password, role } = await request.json();

  const data = await graphql<{ login: AuthPayload }>(LOGIN_MUTATION, {
    email,
    password,
    role
  });

  const result = data.login;

  if (result.errors.length > 0) {
    return json({ errors: result.errors }, { status: 401 });
  }

  if (result.accessToken && result.refreshToken && result.expiresIn) {
    setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, role);
  }

  return json({
    user: result.user,
    role
  });
};
```

**Step 3: Register server route**

Create `front-end/src/routes/api/auth/register/+server.ts`:
```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { graphql } from '$lib/api/client';
import { REGISTER_MUTATION } from '$lib/api/queries/auth';
import { setAuthCookies } from '$lib/api/auth';
import type { AuthPayload } from '$lib/api/types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const input = await request.json();

  const data = await graphql<{ register: AuthPayload }>(REGISTER_MUTATION, { input });

  const result = data.register;

  if (result.errors.length > 0) {
    return json({ errors: result.errors }, { status: 422 });
  }

  if (result.accessToken && result.refreshToken && result.expiresIn) {
    setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, input.role);
  }

  return json({
    user: result.user,
    role: input.role
  });
};
```

**Step 4: Refresh server route**

Create `front-end/src/routes/api/auth/refresh/+server.ts`:
```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { graphql } from '$lib/api/client';
import { REFRESH_TOKEN_MUTATION } from '$lib/api/queries/auth';
import { getRefreshToken, getRole, setAuthCookies, clearAuthCookies } from '$lib/api/auth';

export const POST: RequestHandler = async ({ cookies }) => {
  const refreshToken = getRefreshToken(cookies);
  const role = getRole(cookies);

  if (!refreshToken || !role) {
    clearAuthCookies(cookies);
    return json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const data = await graphql<{
      refreshToken: {
        accessToken: string | null;
        refreshToken: string | null;
        expiresIn: number | null;
        errors: Array<{ message: string; path: string[] }>;
      };
    }>(REFRESH_TOKEN_MUTATION, { refreshToken, role });

    const result = data.refreshToken;

    if (result.errors.length > 0) {
      clearAuthCookies(cookies);
      return json({ errors: result.errors }, { status: 401 });
    }

    if (result.accessToken && result.refreshToken && result.expiresIn) {
      setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, role);
    }

    return json({ success: true });
  } catch {
    clearAuthCookies(cookies);
    return json({ error: 'Refresh failed' }, { status: 401 });
  }
};
```

**Step 5: Logout server route**

Create `front-end/src/routes/api/auth/logout/+server.ts`:
```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { graphql } from '$lib/api/client';
import { LOGOUT_MUTATION } from '$lib/api/queries/auth';
import { getAccessToken, clearAuthCookies } from '$lib/api/auth';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = getAccessToken(cookies);

  if (token) {
    try {
      await graphql(LOGOUT_MUTATION, {}, token);
    } catch {
      // Ignore errors — clear cookies regardless
    }
  }

  clearAuthCookies(cookies);
  return json({ success: true });
};
```

**Step 6: GraphQL proxy route**

Create `front-end/src/routes/api/graphql/+server.ts`:
```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { graphql, GraphQLError } from '$lib/api/client';
import { getAccessToken } from '$lib/api/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = getAccessToken(cookies);

  if (!token) {
    return json({ errors: [{ message: 'Not authenticated' }] }, { status: 401 });
  }

  const { query, variables } = await request.json();

  try {
    const data = await graphql(query, variables, token);
    return json({ data });
  } catch (err) {
    if (err instanceof GraphQLError) {
      return json({ errors: err.errors }, { status: 200 });
    }
    return json({ errors: [{ message: 'Internal server error' }] }, { status: 500 });
  }
};
```

**Step 7: Commit**

```bash
git add front-end/
git commit -m "feat(frontend): add BFF auth proxy and GraphQL proxy server routes"
```

---

### Task 5: Auth hooks and route guards

**Files:**
- Create: `front-end/src/hooks.server.ts`
- Modify: `front-end/src/app.d.ts`
- Create: `front-end/src/routes/+layout.server.ts`

**Step 1: Extend app.d.ts with locals types**

Modify `front-end/src/app.d.ts`:
```typescript
import type { SessionUser } from '$lib/api/types';

declare global {
  namespace App {
    interface Locals {
      user: SessionUser | null;
      accessToken: string | null;
    }
    interface PageData {
      user: SessionUser | null;
    }
  }
}

export {};
```

**Step 2: Create hooks.server.ts**

Create `front-end/src/hooks.server.ts`:
```typescript
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import {
  getAccessToken,
  getRefreshToken,
  getRole,
  decodeJwtPayload,
  isTokenExpired,
  setAuthCookies,
  clearAuthCookies
} from '$lib/api/auth';
import { graphql } from '$lib/api/client';
import { REFRESH_TOKEN_MUTATION } from '$lib/api/queries/auth';

const PUBLIC_PATHS = ['/login', '/register', '/api/'];

export const handle: Handle = async ({ event, resolve }) => {
  const { cookies, url } = event;
  const isPublic = PUBLIC_PATHS.some((p) => url.pathname.startsWith(p));

  let accessToken = getAccessToken(cookies);
  let user = accessToken ? decodeJwtPayload(accessToken) : null;

  // Try refresh if access token is expired
  if (accessToken && isTokenExpired(accessToken)) {
    const refreshToken = getRefreshToken(cookies);
    const role = getRole(cookies);

    if (refreshToken && role) {
      try {
        const data = await graphql<{
          refreshToken: {
            accessToken: string | null;
            refreshToken: string | null;
            expiresIn: number | null;
            errors: Array<{ message: string }>;
          };
        }>(REFRESH_TOKEN_MUTATION, { refreshToken, role });

        const result = data.refreshToken;
        if (result.accessToken && result.refreshToken && result.expiresIn) {
          setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, role);
          accessToken = result.accessToken;
          user = decodeJwtPayload(result.accessToken);
        } else {
          clearAuthCookies(cookies);
          accessToken = null;
          user = null;
        }
      } catch {
        clearAuthCookies(cookies);
        accessToken = null;
        user = null;
      }
    } else {
      clearAuthCookies(cookies);
      accessToken = null;
      user = null;
    }
  }

  event.locals.user = user;
  event.locals.accessToken = accessToken ?? null;

  // Redirect unauthenticated users from protected routes
  if (!isPublic && !user) {
    throw redirect(303, '/login');
  }

  // Redirect authenticated users away from login/register
  if (user && (url.pathname === '/login' || url.pathname === '/register')) {
    const dashboard = user.type === 'Teacher' ? '/teacher/dashboard' : '/parent/dashboard';
    throw redirect(303, dashboard);
  }

  // Role-based route guards
  if (user && url.pathname.startsWith('/teacher') && user.type !== 'Teacher') {
    throw redirect(303, '/parent/dashboard');
  }
  if (user && url.pathname.startsWith('/parent') && user.type !== 'Parent') {
    throw redirect(303, '/teacher/dashboard');
  }

  return resolve(event);
};
```

**Step 3: Create root layout server load**

Create `front-end/src/routes/+layout.server.ts`:
```typescript
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user
  };
};
```

**Step 4: Update root page to redirect**

Modify `front-end/src/routes/+page.svelte`:
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  const user = $derived(page.data.user);

  $effect(() => {
    if (user) {
      const dashboard = user.type === 'Teacher' ? '/teacher/dashboard' : '/parent/dashboard';
      goto(dashboard);
    } else {
      goto('/login');
    }
  });
</script>

<div class="min-h-screen bg-background flex items-center justify-center">
  <div class="animate-pulse text-primary text-xl">Loading...</div>
</div>
```

**Step 5: Commit**

```bash
git add front-end/
git commit -m "feat(frontend): add auth hooks, route guards, and session management"
```

---

### Task 6: Utility constants and helpers

**Files:**
- Create: `front-end/src/lib/utils/constants.ts`
- Create: `front-end/src/lib/utils/helpers.ts`

**Step 1: Create constants**

Create `front-end/src/lib/utils/constants.ts`:
```typescript
import type { SkillCategory } from '$lib/api/types';

export const SKILL_CATEGORIES: SkillCategory[] = ['READING', 'MATH', 'WRITING', 'LOGIC', 'SOCIAL'];

export const SKILL_LABELS: Record<SkillCategory, string> = {
  READING: 'Reading',
  MATH: 'Math',
  WRITING: 'Writing',
  LOGIC: 'Logic',
  SOCIAL: 'Social'
};

export const SKILL_COLORS: Record<SkillCategory, string> = {
  READING: '#10B981',
  MATH: '#F59E0B',
  WRITING: '#8B5CF6',
  LOGIC: '#06B6D4',
  SOCIAL: '#F43F5E'
};

export const SKILL_BG_COLORS: Record<SkillCategory, string> = {
  READING: 'bg-emerald-100 text-emerald-700',
  MATH: 'bg-amber-100 text-amber-700',
  WRITING: 'bg-violet-100 text-violet-700',
  LOGIC: 'bg-cyan-100 text-cyan-700',
  SOCIAL: 'bg-rose-100 text-rose-700'
};

export const SKILL_EMOJIS: Record<SkillCategory, string> = {
  READING: '📖',
  MATH: '🔢',
  WRITING: '✏️',
  LOGIC: '🧩',
  SOCIAL: '🤝'
};
```

**Step 2: Create helpers**

Create `front-end/src/lib/utils/helpers.ts`:
```typescript
/**
 * Format a date string (YYYY-MM-DD) to a readable format.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a score (0-100) with color indication.
 */
export function scoreLevel(score: number): 'low' | 'medium' | 'high' | 'excellent' {
  if (score < 40) return 'low';
  if (score < 60) return 'medium';
  if (score < 80) return 'high';
  return 'excellent';
}

export const SCORE_LEVEL_COLORS = {
  low: 'text-red-500',
  medium: 'text-amber-500',
  high: 'text-blue-500',
  excellent: 'text-emerald-500'
};

/**
 * Get today's date as YYYY-MM-DD.
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Capitalize first letter.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
```

**Step 3: Commit**

```bash
git add front-end/src/lib/utils/
git commit -m "feat(frontend): add utility constants and helpers"
```

---

### Task 7: UI components (Button, Card, Input, Alert, Badge)

**Files:**
- Create: `front-end/src/lib/components/ui/Button.svelte`
- Create: `front-end/src/lib/components/ui/Card.svelte`
- Create: `front-end/src/lib/components/ui/Input.svelte`
- Create: `front-end/src/lib/components/ui/Alert.svelte`
- Create: `front-end/src/lib/components/ui/Badge.svelte`
- Create: `front-end/src/lib/components/ui/index.ts`

**Step 1: Button component**

Create `front-end/src/lib/components/ui/Button.svelte`:
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: Snippet;
  }

  let { variant = 'primary', size = 'md', loading = false, children, ...rest }: Props = $props();

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
    secondary: 'bg-secondary text-white hover:bg-violet-600 shadow-sm',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'text-text-muted hover:bg-slate-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
</script>

<button
  class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
    focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed
    {variants[variant]} {sizes[size]}"
  disabled={loading || rest.disabled}
  {...rest}
>
  {#if loading}
    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  {/if}
  {@render children()}
</button>
```

**Step 2: Card component**

Create `front-end/src/lib/components/ui/Card.svelte`:
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    accent?: string;
    hover?: boolean;
    children: Snippet;
    header?: Snippet;
    footer?: Snippet;
  }

  let { class: className = '', accent, hover = false, children, header, footer }: Props = $props();
</script>

<div
  class="bg-surface rounded-xl shadow-sm border border-slate-100 overflow-hidden
    {hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}
    {accent ? `border-l-4 border-l-[${accent}]` : ''}
    {className}"
>
  {#if header}
    <div class="px-6 py-4 border-b border-slate-100">
      {@render header()}
    </div>
  {/if}
  <div class="px-6 py-4">
    {@render children()}
  </div>
  {#if footer}
    <div class="px-6 py-3 bg-slate-50 border-t border-slate-100">
      {@render footer()}
    </div>
  {/if}
</div>
```

**Step 3: Input component**

Create `front-end/src/lib/components/ui/Input.svelte`:
```svelte
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    label?: string;
    error?: string;
    value?: string;
  }

  let { label, error, value = $bindable(''), ...rest }: Props = $props();
</script>

<div class="space-y-1">
  {#if label}
    <label class="block text-sm font-medium text-text" for={rest.id}>
      {label}
    </label>
  {/if}
  <input
    class="w-full px-3 py-2 rounded-lg border transition-colors
      focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
      {error ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-200'}"
    bind:value
    {...rest}
  />
  {#if error}
    <p class="text-sm text-red-500">{error}</p>
  {/if}
</div>
```

**Step 4: Alert component**

Create `front-end/src/lib/components/ui/Alert.svelte`:
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'info' | 'success' | 'warning' | 'error';
    children: Snippet;
  }

  let { variant = 'info', children }: Props = $props();

  const variants = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200'
  };
</script>

<div class="px-4 py-3 rounded-lg border {variants[variant]}" role="alert">
  {@render children()}
</div>
```

**Step 5: Badge component**

Create `front-end/src/lib/components/ui/Badge.svelte`:
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    children: Snippet;
  }

  let { variant = 'default', children }: Props = $props();

  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700'
  };
</script>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {variants[variant]}">
  {@render children()}
</span>
```

**Step 6: Barrel export**

Create `front-end/src/lib/components/ui/index.ts`:
```typescript
export { default as Button } from './Button.svelte';
export { default as Card } from './Card.svelte';
export { default as Input } from './Input.svelte';
export { default as Alert } from './Alert.svelte';
export { default as Badge } from './Badge.svelte';
```

**Step 7: Commit**

```bash
git add front-end/src/lib/components/ui/
git commit -m "feat(frontend): add base UI components (Button, Card, Input, Alert, Badge)"
```

---

### Task 8: Login and Register pages

**Files:**
- Create: `front-end/src/routes/login/+page.svelte`
- Create: `front-end/src/routes/login/+page.server.ts`
- Create: `front-end/src/routes/register/+page.svelte`
- Create: `front-end/src/routes/register/+page.server.ts`

**Step 1: Login page server (form action)**

Create `front-end/src/routes/login/+page.server.ts`:
```typescript
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { graphql } from '$lib/api/client';
import { LOGIN_MUTATION } from '$lib/api/queries/auth';
import { setAuthCookies } from '$lib/api/auth';
import type { AuthPayload } from '$lib/api/types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    if (!email || !password || !role) {
      return fail(400, { error: 'All fields are required', email, role });
    }

    try {
      const data = await graphql<{ login: AuthPayload }>(LOGIN_MUTATION, {
        email,
        password,
        role
      });

      const result = data.login;

      if (result.errors.length > 0) {
        return fail(401, {
          error: result.errors[0].message,
          email,
          role
        });
      }

      if (result.accessToken && result.refreshToken && result.expiresIn) {
        setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, role);
      }
    } catch {
      return fail(500, { error: 'Something went wrong. Please try again.', email, role });
    }

    const dashboard = role === 'teacher' ? '/teacher/dashboard' : '/parent/dashboard';
    throw redirect(303, dashboard);
  }
};
```

**Step 2: Login page UI**

Create `front-end/src/routes/login/+page.svelte`:
```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Input, Alert } from '$lib/components/ui';

  let { form } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>Login — GrewMe</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">GrewMe</h1>
      <p class="text-text-muted">Kids Learning Radar</p>
    </div>

    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-8">
      <h2 class="text-xl font-semibold text-text mb-6">Sign in to your account</h2>

      {#if form?.error}
        <div class="mb-4">
          <Alert variant="error">{form.error}</Alert>
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
          };
        }}
        class="space-y-4"
      >
        <Input
          label="Email"
          type="email"
          name="email"
          id="email"
          value={form?.email ?? ''}
          placeholder="you@example.com"
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          id="password"
          placeholder="••••••••"
          required
        />

        <div class="space-y-1">
          <label class="block text-sm font-medium text-text">I am a...</label>
          <div class="flex gap-3">
            <label class="flex-1">
              <input type="radio" name="role" value="teacher" checked={form?.role !== 'parent'} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary
                transition-colors text-sm font-medium">
                Teacher
              </div>
            </label>
            <label class="flex-1">
              <input type="radio" name="role" value="parent" checked={form?.role === 'parent'} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-secondary peer-checked:bg-secondary/5 peer-checked:text-secondary
                transition-colors text-sm font-medium">
                Parent
              </div>
            </label>
          </div>
        </div>

        <Button type="submit" {loading} class="w-full">
          Sign in
        </Button>
      </form>

      <p class="mt-6 text-center text-sm text-text-muted">
        Don't have an account?
        <a href="/register" class="text-primary hover:underline font-medium">Register</a>
      </p>
    </div>
  </div>
</div>
```

**Step 3: Register page server (form action)**

Create `front-end/src/routes/register/+page.server.ts`:
```typescript
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { graphql } from '$lib/api/client';
import { REGISTER_MUTATION } from '$lib/api/queries/auth';
import { setAuthCookies } from '$lib/api/auth';
import type { AuthPayload } from '$lib/api/types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const passwordConfirmation = formData.get('passwordConfirmation') as string;
    const role = formData.get('role') as string;
    const phone = formData.get('phone') as string;

    if (!name || !email || !password || !passwordConfirmation || !role) {
      return fail(400, { error: 'All fields are required', name, email, role });
    }

    if (password !== passwordConfirmation) {
      return fail(400, { error: 'Passwords do not match', name, email, role });
    }

    try {
      const data = await graphql<{ register: AuthPayload }>(REGISTER_MUTATION, {
        input: { name, email, password, passwordConfirmation, role, phone: phone || null }
      });

      const result = data.register;

      if (result.errors.length > 0) {
        return fail(422, {
          error: result.errors.map((e) => e.message).join(', '),
          name,
          email,
          role
        });
      }

      if (result.accessToken && result.refreshToken && result.expiresIn) {
        setAuthCookies(cookies, result.accessToken, result.refreshToken, result.expiresIn, role);
      }
    } catch {
      return fail(500, { error: 'Something went wrong. Please try again.', name, email, role });
    }

    const dashboard = role === 'teacher' ? '/teacher/dashboard' : '/parent/dashboard';
    throw redirect(303, dashboard);
  }
};
```

**Step 4: Register page UI**

Create `front-end/src/routes/register/+page.svelte`:
```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Input, Alert } from '$lib/components/ui';

  let { form } = $props();
  let loading = $state(false);
  let role = $state(form?.role ?? 'teacher');
</script>

<svelte:head>
  <title>Register — GrewMe</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">GrewMe</h1>
      <p class="text-text-muted">Create your account</p>
    </div>

    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-8">
      <h2 class="text-xl font-semibold text-text mb-6">Register</h2>

      {#if form?.error}
        <div class="mb-4">
          <Alert variant="error">{form.error}</Alert>
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
          };
        }}
        class="space-y-4"
      >
        <Input
          label="Full Name"
          type="text"
          name="name"
          id="name"
          value={form?.name ?? ''}
          placeholder="John Doe"
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          id="email"
          value={form?.email ?? ''}
          placeholder="you@example.com"
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          id="password"
          placeholder="••••••••"
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          name="passwordConfirmation"
          id="passwordConfirmation"
          placeholder="••••••••"
          required
        />

        <div class="space-y-1">
          <label class="block text-sm font-medium text-text">I am a...</label>
          <div class="flex gap-3">
            <label class="flex-1">
              <input type="radio" name="role" value="teacher" bind:group={role} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary
                transition-colors text-sm font-medium">
                Teacher
              </div>
            </label>
            <label class="flex-1">
              <input type="radio" name="role" value="parent" bind:group={role} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-secondary peer-checked:bg-secondary/5 peer-checked:text-secondary
                transition-colors text-sm font-medium">
                Parent
              </div>
            </label>
          </div>
        </div>

        {#if role === 'parent'}
          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            id="phone"
            placeholder="+62 812 3456 7890"
          />
        {/if}

        <Button type="submit" {loading} class="w-full">
          Create Account
        </Button>
      </form>

      <p class="mt-6 text-center text-sm text-text-muted">
        Already have an account?
        <a href="/login" class="text-primary hover:underline font-medium">Sign in</a>
      </p>
    </div>
  </div>
</div>
```

**Step 5: Verify login/register pages render**

Run: `cd front-end && npm run dev`
Visit http://localhost:5173/login and http://localhost:5173/register

**Step 6: Commit**

```bash
git add front-end/
git commit -m "feat(frontend): add login and register pages with form actions"
```

---

### Task 9: Layout components (Sidebar, Navbar)

**Files:**
- Create: `front-end/src/lib/components/layout/Sidebar.svelte`
- Create: `front-end/src/lib/components/layout/Navbar.svelte`
- Create: `front-end/src/lib/components/layout/AppShell.svelte`
- Create: `front-end/src/lib/components/layout/index.ts`

**Step 1: Sidebar component**

Create `front-end/src/lib/components/layout/Sidebar.svelte`:
```svelte
<script lang="ts">
  import { page } from '$app/state';

  interface NavItem {
    label: string;
    href: string;
    icon: string;
  }

  interface Props {
    items: NavItem[];
  }

  let { items }: Props = $props();
</script>

<aside class="w-64 bg-surface border-r border-slate-100 min-h-screen p-4 flex flex-col">
  <a href="/" class="flex items-center gap-2 px-3 py-2 mb-6">
    <span class="text-2xl font-bold text-primary">GrewMe</span>
  </a>

  <nav class="flex-1 space-y-1">
    {#each items as item}
      {@const active = page.url.pathname.startsWith(item.href)}
      <a
        href={item.href}
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
          {active
            ? 'bg-primary/10 text-primary'
            : 'text-text-muted hover:bg-slate-50 hover:text-text'}"
      >
        <span class="text-lg">{item.icon}</span>
        {item.label}
      </a>
    {/each}
  </nav>
</aside>
```

**Step 2: Navbar component**

Create `front-end/src/lib/components/layout/Navbar.svelte`:
```svelte
<script lang="ts">
  import { Badge } from '$lib/components/ui';
  import type { SessionUser } from '$lib/api/types';

  interface Props {
    user: SessionUser;
  }

  let { user }: Props = $props();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }
</script>

<header class="bg-surface border-b border-slate-100 px-6 py-3 flex items-center justify-between">
  <div></div>
  <div class="flex items-center gap-4">
    <Badge variant={user.type === 'Teacher' ? 'primary' : 'success'}>
      {user.type}
    </Badge>
    <span class="text-sm text-text">{user.email}</span>
    <button
      onclick={logout}
      class="text-sm text-text-muted hover:text-red-500 transition-colors"
    >
      Sign out
    </button>
  </div>
</header>
```

**Step 3: AppShell component**

Create `front-end/src/lib/components/layout/AppShell.svelte`:
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Sidebar from './Sidebar.svelte';
  import Navbar from './Navbar.svelte';
  import type { SessionUser } from '$lib/api/types';

  interface NavItem {
    label: string;
    href: string;
    icon: string;
  }

  interface Props {
    user: SessionUser;
    navItems: NavItem[];
    children: Snippet;
  }

  let { user, navItems, children }: Props = $props();
</script>

<div class="flex min-h-screen bg-background">
  <Sidebar items={navItems} />
  <div class="flex-1 flex flex-col">
    <Navbar {user} />
    <main class="flex-1 p-6">
      {@render children()}
    </main>
  </div>
</div>
```

**Step 4: Barrel export**

Create `front-end/src/lib/components/layout/index.ts`:
```typescript
export { default as Sidebar } from './Sidebar.svelte';
export { default as Navbar } from './Navbar.svelte';
export { default as AppShell } from './AppShell.svelte';
```

**Step 5: Commit**

```bash
git add front-end/src/lib/components/layout/
git commit -m "feat(frontend): add layout components (Sidebar, Navbar, AppShell)"
```

---

## Phase 2: Teacher Flow

### Task 10: Teacher layout and dashboard

**Files:**
- Create: `front-end/src/routes/teacher/+layout.svelte`
- Create: `front-end/src/routes/teacher/+layout.server.ts`
- Create: `front-end/src/routes/teacher/dashboard/+page.svelte`
- Create: `front-end/src/routes/teacher/dashboard/+page.server.ts`

**Step 1: Teacher layout server (guard + data)**

Create `front-end/src/routes/teacher/+layout.server.ts`:
```typescript
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.type !== 'Teacher') {
    throw redirect(303, '/login');
  }
  return { user: locals.user };
};
```

**Step 2: Teacher layout UI**

Create `front-end/src/routes/teacher/+layout.svelte`:
```svelte
<script lang="ts">
  import { AppShell } from '$lib/components/layout';

  let { data, children } = $props();

  const navItems = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: '🏠' },
    { label: 'Score Entry', href: '/teacher/scores', icon: '📝' }
  ];
</script>

<AppShell user={data.user} {navItems}>
  {@render children()}
</AppShell>
```

**Step 3: Teacher dashboard server load**

Create `front-end/src/routes/teacher/dashboard/+page.server.ts`:
```typescript
import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import type { Classroom } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals }) => {
  const data = await graphql<{ classrooms: Classroom[] }>(
    CLASSROOMS_QUERY,
    {},
    locals.accessToken!
  );

  return {
    classrooms: data.classrooms
  };
};
```

**Step 4: Teacher dashboard UI**

Create `front-end/src/routes/teacher/dashboard/+page.svelte`:
```svelte
<script lang="ts">
  import { Card } from '$lib/components/ui';

  let { data } = $props();
</script>

<svelte:head>
  <title>Dashboard — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">My Classrooms</h1>

  {#if data.classrooms.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No classrooms yet</p>
      <p class="text-sm mt-1">Classrooms will appear here once assigned.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each data.classrooms as classroom}
        <a href="/teacher/classrooms/{classroom.id}">
          <Card hover>
            <h3 class="text-lg font-semibold text-text">{classroom.name}</h3>
            {#if classroom.school}
              <p class="text-sm text-text-muted mt-1">{classroom.school.name}</p>
            {/if}
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
```

**Step 5: Commit**

```bash
git add front-end/src/routes/teacher/
git commit -m "feat(frontend): add teacher layout and dashboard page"
```

---

### Task 11: Radar chart component

**Files:**
- Modify: `front-end/package.json` (install chart.js + svelte-chartjs)
- Create: `front-end/src/lib/components/charts/RadarChart.svelte`
- Create: `front-end/src/lib/components/charts/index.ts`

**Step 1: Install Chart.js and svelte-chartjs**

Run:
```bash
cd front-end && npm install chart.js svelte-chartjs
```

**Step 2: Create RadarChart component**

Create `front-end/src/lib/components/charts/RadarChart.svelte`:
```svelte
<script lang="ts">
  import { Radar } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
  } from 'chart.js';
  import type { RadarSkills } from '$lib/api/types';
  import { SKILL_LABELS, SKILL_COLORS } from '$lib/utils/constants';

  ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

  interface Props {
    skills: RadarSkills;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
  }

  let { skills, label = 'Skills', size = 'md' }: Props = $props();

  const sizeClasses = {
    sm: 'w-48 h-48',
    md: 'w-80 h-80',
    lg: 'w-96 h-96'
  };

  const skillKeys = ['reading', 'math', 'writing', 'logic', 'social'] as const;
  const labels = skillKeys.map((k) => SKILL_LABELS[k.toUpperCase() as keyof typeof SKILL_LABELS]);
  const colors = skillKeys.map((k) => SKILL_COLORS[k.toUpperCase() as keyof typeof SKILL_COLORS]);

  const chartData = $derived({
    labels,
    datasets: [
      {
        label,
        data: skillKeys.map((k) => skills[k] ?? 0),
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: '#3B82F6',
        borderWidth: 2,
        pointBackgroundColor: colors,
        pointBorderColor: colors,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  });

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          stepSize: 20,
          display: true,
          backdropColor: 'transparent',
          font: { size: 10 }
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)'
        },
        angleLines: {
          color: 'rgba(148, 163, 184, 0.2)'
        },
        pointLabels: {
          font: { size: 13, weight: '600' as const },
          color: colors
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => `${ctx.raw}/100`
        }
      }
    },
    animation: {
      duration: 800
    }
  };
</script>

<div class="{sizeClasses[size]} mx-auto">
  <Radar data={chartData} {options} />
</div>
```

**Step 3: Barrel export**

Create `front-end/src/lib/components/charts/index.ts`:
```typescript
export { default as RadarChart } from './RadarChart.svelte';
```

**Step 4: Commit**

```bash
git add front-end/
git commit -m "feat(frontend): add RadarChart component with Chart.js"
```

---

### Task 12: Classroom detail page

**Files:**
- Create: `front-end/src/routes/teacher/classrooms/[id]/+page.server.ts`
- Create: `front-end/src/routes/teacher/classrooms/[id]/+page.svelte`

**Step 1: Classroom detail server load**

Create `front-end/src/routes/teacher/classrooms/[id]/+page.server.ts`:
```typescript
import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOM_QUERY, CLASSROOM_OVERVIEW_QUERY } from '$lib/api/queries/classrooms';
import type { Classroom, ClassroomOverview } from '$lib/api/types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const [classroomData, overviewData] = await Promise.all([
    graphql<{ classroom: Classroom }>(CLASSROOM_QUERY, { id: params.id }, locals.accessToken!),
    graphql<{ classroomOverview: ClassroomOverview }>(
      CLASSROOM_OVERVIEW_QUERY,
      { classroomId: params.id },
      locals.accessToken!
    )
  ]);

  return {
    classroom: classroomData.classroom,
    overview: overviewData.classroomOverview
  };
};
```

**Step 2: Classroom detail UI**

Create `front-end/src/routes/teacher/classrooms/[id]/+page.svelte`:
```svelte
<script lang="ts">
  import { Card } from '$lib/components/ui';
  import { RadarChart } from '$lib/components/charts';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.classroom.name} — GrewMe</title>
</svelte:head>

<div>
  <div class="mb-6">
    <a href="/teacher/dashboard" class="text-sm text-text-muted hover:text-primary transition-colors">
      ← Back to Dashboard
    </a>
    <h1 class="text-2xl font-bold text-text mt-2">{data.classroom.name}</h1>
    {#if data.classroom.school}
      <p class="text-text-muted">{data.classroom.school.name}</p>
    {/if}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Student List -->
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">
          Students ({data.classroom.students?.length ?? 0})
        </h2>
      {/snippet}
      {#if data.classroom.students && data.classroom.students.length > 0}
        <div class="divide-y divide-slate-100 -mx-6 -my-4">
          {#each data.classroom.students as student}
            <a
              href="/teacher/students/{student.id}"
              class="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
            >
              <span class="font-medium text-text">{student.name}</span>
              <span class="text-sm text-text-muted">View →</span>
            </a>
          {/each}
        </div>
      {:else}
        <p class="text-text-muted text-center py-4">No students enrolled</p>
      {/if}
    </Card>

    <!-- Class Overview Radar -->
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">Class Overview</h2>
      {/snippet}
      {#if data.overview.students.length > 0}
        <div class="space-y-6">
          {#each data.overview.students as student}
            <div>
              <h3 class="text-sm font-medium text-text-muted mb-2">{student.studentName}</h3>
              <RadarChart skills={student.skills} label={student.studentName} size="sm" />
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-text-muted text-center py-4">No data available</p>
      {/if}
    </Card>
  </div>
</div>
```

**Step 3: Commit**

```bash
git add front-end/src/routes/teacher/classrooms/
git commit -m "feat(frontend): add classroom detail page with overview radars"
```

---

### Task 13: Student detail page (radar + progress + scores)

**Files:**
- Create: `front-end/src/lib/components/charts/ProgressChart.svelte`
- Create: `front-end/src/routes/teacher/students/[id]/+page.server.ts`
- Create: `front-end/src/routes/teacher/students/[id]/+page.svelte`

**Step 1: ProgressChart component**

Create `front-end/src/lib/components/charts/ProgressChart.svelte`:
```svelte
<script lang="ts">
  import { Line } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
  } from 'chart.js';
  import type { ProgressData } from '$lib/api/types';
  import { SKILL_LABELS, SKILL_COLORS } from '$lib/utils/constants';

  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

  interface Props {
    progress: ProgressData;
  }

  let { progress }: Props = $props();

  const skillKeys = ['reading', 'math', 'writing', 'logic', 'social'] as const;

  const chartData = $derived({
    labels: progress.weeks.map((w) => w.period),
    datasets: skillKeys.map((key) => ({
      label: SKILL_LABELS[key.toUpperCase() as keyof typeof SKILL_LABELS],
      data: progress.weeks.map((w) => w.skills[key] ?? 0),
      borderColor: SKILL_COLORS[key.toUpperCase() as keyof typeof SKILL_COLORS],
      backgroundColor: SKILL_COLORS[key.toUpperCase() as keyof typeof SKILL_COLORS] + '20',
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6
    }))
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20 }
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, padding: 16 }
      }
    }
  };
</script>

<div class="h-64">
  <Line data={chartData} {options} />
</div>
```

Update `front-end/src/lib/components/charts/index.ts`:
```typescript
export { default as RadarChart } from './RadarChart.svelte';
export { default as ProgressChart } from './ProgressChart.svelte';
```

**Step 2: Student detail server load**

Create `front-end/src/routes/teacher/students/[id]/+page.server.ts`:
```typescript
import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { STUDENT_RADAR_QUERY, STUDENT_PROGRESS_QUERY, STUDENT_DAILY_SCORES_QUERY } from '$lib/api/queries/students';
import type { RadarData, ProgressData, DailyScore, Connection } from '$lib/api/types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const [radarData, progressData, scoresData] = await Promise.all([
    graphql<{ studentRadar: RadarData }>(
      STUDENT_RADAR_QUERY,
      { studentId: params.id },
      locals.accessToken!
    ),
    graphql<{ studentProgress: ProgressData }>(
      STUDENT_PROGRESS_QUERY,
      { studentId: params.id },
      locals.accessToken!
    ),
    graphql<{ studentDailyScores: Connection<DailyScore> }>(
      STUDENT_DAILY_SCORES_QUERY,
      { studentId: params.id, first: 20 },
      locals.accessToken!
    )
  ]);

  return {
    radar: radarData.studentRadar,
    progress: progressData.studentProgress,
    scores: scoresData.studentDailyScores.nodes
  };
};
```

**Step 3: Student detail UI**

Create `front-end/src/routes/teacher/students/[id]/+page.svelte`:
```svelte
<script lang="ts">
  import { Card, Badge } from '$lib/components/ui';
  import { RadarChart, ProgressChart } from '$lib/components/charts';
  import { SKILL_LABELS, SKILL_BG_COLORS, SKILL_EMOJIS } from '$lib/utils/constants';
  import { formatDate } from '$lib/utils/helpers';
  import type { SkillCategory } from '$lib/api/types';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.radar.studentName} — GrewMe</title>
</svelte:head>

<div>
  <div class="mb-6">
    <button onclick={() => history.back()} class="text-sm text-text-muted hover:text-primary transition-colors">
      ← Back
    </button>
    <h1 class="text-2xl font-bold text-text mt-2">{data.radar.studentName}</h1>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- Radar Chart -->
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">Skill Radar</h2>
      {/snippet}
      <RadarChart skills={data.radar.skills} label={data.radar.studentName} size="lg" />
    </Card>

    <!-- Progress Chart -->
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">Weekly Progress</h2>
      {/snippet}
      <ProgressChart progress={data.progress} />
    </Card>
  </div>

  <!-- Daily Scores Table -->
  <Card>
    {#snippet header()}
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-text">Recent Scores</h2>
        <a
          href="/teacher/scores?student={data.radar.studentId}"
          class="text-sm text-primary hover:underline"
        >
          + Add Score
        </a>
      </div>
    {/snippet}
    {#if data.scores.length > 0}
      <div class="overflow-x-auto -mx-6 -my-4">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Date</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Skill</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Score</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Teacher</th>
            </tr>
          </thead>
          <tbody>
            {#each data.scores as score}
              <tr class="border-b border-slate-50">
                <td class="px-6 py-3 text-sm text-text">{formatDate(score.date)}</td>
                <td class="px-6 py-3">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {SKILL_BG_COLORS[score.skillCategory]}">
                    {SKILL_EMOJIS[score.skillCategory]}
                    {SKILL_LABELS[score.skillCategory]}
                  </span>
                </td>
                <td class="px-6 py-3 text-sm font-semibold text-text">{score.score}</td>
                <td class="px-6 py-3 text-sm text-text-muted">{score.teacher.name}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="text-text-muted text-center py-4">No scores recorded yet</p>
    {/if}
  </Card>
</div>
```

**Step 4: Commit**

```bash
git add front-end/
git commit -m "feat(frontend): add student detail page with radar, progress, and scores"
```

---

### Task 14: Daily score entry page

**Files:**
- Create: `front-end/src/routes/teacher/scores/+page.server.ts`
- Create: `front-end/src/routes/teacher/scores/+page.svelte`

**Step 1: Score entry server (load classrooms + form action)**

Create `front-end/src/routes/teacher/scores/+page.server.ts`:
```typescript
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOMS_QUERY, CLASSROOM_QUERY } from '$lib/api/queries/classrooms';
import { CREATE_DAILY_SCORE_MUTATION } from '$lib/api/queries/students';
import type { Classroom } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const data = await graphql<{ classrooms: Classroom[] }>(
    CLASSROOMS_QUERY,
    {},
    locals.accessToken!
  );

  // If a classroom is selected, load its students
  const classroomId = url.searchParams.get('classroom');
  let students: Array<{ id: string; name: string }> = [];

  if (classroomId) {
    const classroomData = await graphql<{ classroom: Classroom }>(
      CLASSROOM_QUERY,
      { id: classroomId },
      locals.accessToken!
    );
    students = classroomData.classroom.students ?? [];
  }

  return {
    classrooms: data.classrooms,
    selectedClassroom: classroomId,
    selectedStudent: url.searchParams.get('student'),
    students
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const studentId = formData.get('studentId') as string;
    const date = formData.get('date') as string;
    const skillCategory = formData.get('skillCategory') as string;
    const score = parseInt(formData.get('score') as string, 10);

    if (!studentId || !date || !skillCategory || isNaN(score)) {
      return fail(400, { error: 'All fields are required' });
    }

    if (score < 0 || score > 100) {
      return fail(400, { error: 'Score must be between 0 and 100' });
    }

    try {
      const data = await graphql<{
        createDailyScore: {
          dailyScore: { id: string } | null;
          errors: Array<{ message: string; path: string[] }>;
        };
      }>(
        CREATE_DAILY_SCORE_MUTATION,
        {
          input: {
            studentId,
            date,
            skillCategory: skillCategory.toLowerCase(),
            score
          }
        },
        locals.accessToken!
      );

      const result = data.createDailyScore;

      if (result.errors.length > 0) {
        return fail(422, { error: result.errors[0].message });
      }

      return { success: true };
    } catch {
      return fail(500, { error: 'Something went wrong' });
    }
  }
};
```

**Step 2: Score entry UI**

Create `front-end/src/routes/teacher/scores/+page.svelte`:
```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { Button, Input, Card, Alert } from '$lib/components/ui';
  import { SKILL_CATEGORIES, SKILL_LABELS, SKILL_EMOJIS, SKILL_BG_COLORS } from '$lib/utils/constants';
  import { today } from '$lib/utils/helpers';
  import type { SkillCategory } from '$lib/api/types';

  let { data, form } = $props();
  let loading = $state(false);
  let selectedSkill = $state<SkillCategory | ''>('');

  function onClassroomChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    goto(`/teacher/scores?classroom=${target.value}`, { replaceState: true });
  }
</script>

<svelte:head>
  <title>Add Score — GrewMe</title>
</svelte:head>

<div class="max-w-lg mx-auto">
  <h1 class="text-2xl font-bold text-text mb-6">Add Daily Score</h1>

  {#if form?.success}
    <div class="mb-4">
      <Alert variant="success">Score added successfully!</Alert>
    </div>
  {/if}

  {#if form?.error}
    <div class="mb-4">
      <Alert variant="error">{form.error}</Alert>
    </div>
  {/if}

  <Card>
    <form
      method="POST"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          loading = false;
          await update();
        };
      }}
      class="space-y-5"
    >
      <!-- Classroom selector -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-text" for="classroom">Classroom</label>
        <select
          id="classroom"
          onchange={onClassroomChange}
          value={data.selectedClassroom ?? ''}
          class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Select classroom...</option>
          {#each data.classrooms as classroom}
            <option value={classroom.id}>{classroom.name}</option>
          {/each}
        </select>
      </div>

      <!-- Student selector -->
      {#if data.students.length > 0}
        <div class="space-y-1">
          <label class="block text-sm font-medium text-text" for="studentId">Student</label>
          <select
            id="studentId"
            name="studentId"
            value={data.selectedStudent ?? ''}
            class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          >
            <option value="">Select student...</option>
            {#each data.students as student}
              <option value={student.id}>{student.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- Date -->
      <Input label="Date" type="date" name="date" id="date" value={today()} required />

      <!-- Skill Category -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-text">Skill Category</label>
        <div class="flex flex-wrap gap-2">
          {#each SKILL_CATEGORIES as skill}
            <label>
              <input
                type="radio"
                name="skillCategory"
                value={skill}
                bind:group={selectedSkill}
                class="peer sr-only"
                required
              />
              <div class="px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer border-2 border-transparent
                peer-checked:{SKILL_BG_COLORS[skill]} peer-checked:border-current
                bg-slate-100 text-slate-600 transition-colors">
                {SKILL_EMOJIS[skill]} {SKILL_LABELS[skill]}
              </div>
            </label>
          {/each}
        </div>
      </div>

      <!-- Score -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-text" for="score">Score (0-100)</label>
        <input
          type="range"
          name="score"
          id="score"
          min="0"
          max="100"
          value="50"
          class="w-full accent-primary"
        />
        <div class="flex justify-between text-xs text-text-muted">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      <Button type="submit" {loading} class="w-full">
        Save Score
      </Button>
    </form>
  </Card>
</div>
```

**Step 3: Commit**

```bash
git add front-end/src/routes/teacher/scores/
git commit -m "feat(frontend): add daily score entry page"
```

---

## Phase 3: Parent Flow

### Task 15: Parent layout and dashboard

**Files:**
- Create: `front-end/src/routes/parent/+layout.svelte`
- Create: `front-end/src/routes/parent/+layout.server.ts`
- Create: `front-end/src/routes/parent/dashboard/+page.svelte`
- Create: `front-end/src/routes/parent/dashboard/+page.server.ts`

**Step 1: Parent layout server**

Create `front-end/src/routes/parent/+layout.server.ts`:
```typescript
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.type !== 'Parent') {
    throw redirect(303, '/login');
  }
  return { user: locals.user };
};
```

**Step 2: Parent layout UI**

Create `front-end/src/routes/parent/+layout.svelte`:
```svelte
<script lang="ts">
  import { AppShell } from '$lib/components/layout';

  let { data, children } = $props();

  const navItems = [
    { label: 'My Children', href: '/parent/dashboard', icon: '👨‍👧‍👦' }
  ];
</script>

<AppShell user={data.user} {navItems}>
  {@render children()}
</AppShell>
```

**Step 3: Parent dashboard server load**

Create `front-end/src/routes/parent/dashboard/+page.server.ts`:
```typescript
import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { MY_CHILDREN_QUERY } from '$lib/api/queries/parents';
import { STUDENT_RADAR_QUERY } from '$lib/api/queries/students';
import type { Student, RadarData } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals }) => {
  const childrenData = await graphql<{ myChildren: Student[] }>(
    MY_CHILDREN_QUERY,
    {},
    locals.accessToken!
  );

  // Load radar data for each child
  const childrenWithRadar = await Promise.all(
    childrenData.myChildren.map(async (child) => {
      try {
        const radarData = await graphql<{ studentRadar: RadarData }>(
          STUDENT_RADAR_QUERY,
          { studentId: child.id },
          locals.accessToken!
        );
        return { ...child, radar: radarData.studentRadar.skills };
      } catch {
        return { ...child, radar: null };
      }
    })
  );

  return { children: childrenWithRadar };
};
```

**Step 4: Parent dashboard UI**

Create `front-end/src/routes/parent/dashboard/+page.svelte`:
```svelte
<script lang="ts">
  import { Card } from '$lib/components/ui';
  import { RadarChart } from '$lib/components/charts';

  let { data } = $props();
</script>

<svelte:head>
  <title>My Children — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">My Children</h1>

  {#if data.children.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No children linked yet</p>
      <p class="text-sm mt-1">Ask your child's teacher to link your account.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each data.children as child}
        <a href="/parent/children/{child.id}">
          <Card hover>
            <h3 class="text-lg font-semibold text-text mb-3">{child.name}</h3>
            {#if child.radar}
              <RadarChart skills={child.radar} label={child.name} size="sm" />
            {:else}
              <p class="text-sm text-text-muted text-center py-8">No data yet</p>
            {/if}
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
```

**Step 5: Commit**

```bash
git add front-end/src/routes/parent/
git commit -m "feat(frontend): add parent layout and dashboard with children radars"
```

---

### Task 16: Child detail page (read-only)

**Files:**
- Create: `front-end/src/routes/parent/children/[id]/+page.server.ts`
- Create: `front-end/src/routes/parent/children/[id]/+page.svelte`

**Step 1: Child detail server load**

Create `front-end/src/routes/parent/children/[id]/+page.server.ts`:
```typescript
import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { STUDENT_RADAR_QUERY, STUDENT_PROGRESS_QUERY, STUDENT_DAILY_SCORES_QUERY } from '$lib/api/queries/students';
import type { RadarData, ProgressData, DailyScore, Connection } from '$lib/api/types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const [radarData, progressData, scoresData] = await Promise.all([
    graphql<{ studentRadar: RadarData }>(
      STUDENT_RADAR_QUERY,
      { studentId: params.id },
      locals.accessToken!
    ),
    graphql<{ studentProgress: ProgressData }>(
      STUDENT_PROGRESS_QUERY,
      { studentId: params.id },
      locals.accessToken!
    ),
    graphql<{ studentDailyScores: Connection<DailyScore> }>(
      STUDENT_DAILY_SCORES_QUERY,
      { studentId: params.id, first: 20 },
      locals.accessToken!
    )
  ]);

  return {
    radar: radarData.studentRadar,
    progress: progressData.studentProgress,
    scores: scoresData.studentDailyScores.nodes
  };
};
```

**Step 2: Child detail UI (same as student detail but read-only)**

Create `front-end/src/routes/parent/children/[id]/+page.svelte`:
```svelte
<script lang="ts">
  import { Card } from '$lib/components/ui';
  import { RadarChart, ProgressChart } from '$lib/components/charts';
  import { SKILL_LABELS, SKILL_BG_COLORS, SKILL_EMOJIS } from '$lib/utils/constants';
  import { formatDate } from '$lib/utils/helpers';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.radar.studentName} — GrewMe</title>
</svelte:head>

<div>
  <div class="mb-6">
    <a href="/parent/dashboard" class="text-sm text-text-muted hover:text-primary transition-colors">
      ← Back to My Children
    </a>
    <h1 class="text-2xl font-bold text-text mt-2">{data.radar.studentName}</h1>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">Skill Radar</h2>
      {/snippet}
      <RadarChart skills={data.radar.skills} label={data.radar.studentName} size="lg" />
    </Card>

    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">Weekly Progress</h2>
      {/snippet}
      <ProgressChart progress={data.progress} />
    </Card>
  </div>

  <Card>
    {#snippet header()}
      <h2 class="text-lg font-semibold text-text">Recent Scores</h2>
    {/snippet}
    {#if data.scores.length > 0}
      <div class="overflow-x-auto -mx-6 -my-4">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Date</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Skill</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Score</th>
            </tr>
          </thead>
          <tbody>
            {#each data.scores as score}
              <tr class="border-b border-slate-50">
                <td class="px-6 py-3 text-sm text-text">{formatDate(score.date)}</td>
                <td class="px-6 py-3">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {SKILL_BG_COLORS[score.skillCategory]}">
                    {SKILL_EMOJIS[score.skillCategory]}
                    {SKILL_LABELS[score.skillCategory]}
                  </span>
                </td>
                <td class="px-6 py-3 text-sm font-semibold text-text">{score.score}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="text-text-muted text-center py-4">No scores recorded yet</p>
    {/if}
  </Card>
</div>
```

**Step 3: Commit**

```bash
git add front-end/src/routes/parent/children/
git commit -m "feat(frontend): add parent child detail page (read-only radar + progress)"
```

---

## Phase 4: Admin + Polish

### Task 17: Permission management page

**Files:**
- Create: `front-end/src/routes/admin/+layout.server.ts`
- Create: `front-end/src/routes/admin/+layout.svelte`
- Create: `front-end/src/routes/admin/permissions/+page.server.ts`
- Create: `front-end/src/routes/admin/permissions/+page.svelte`

**Step 1: Admin layout server**

Create `front-end/src/routes/admin/+layout.server.ts`:
```typescript
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  // Admin access is permission-based, not role-based
  // The actual permission check happens in the page server load
  return { user: locals.user };
};
```

**Step 2: Admin layout UI**

Create `front-end/src/routes/admin/+layout.svelte`:
```svelte
<script lang="ts">
  import { AppShell } from '$lib/components/layout';

  let { data, children } = $props();

  const navItems = [
    { label: 'Dashboard', href: data.user.type === 'Teacher' ? '/teacher/dashboard' : '/parent/dashboard', icon: '🏠' },
    { label: 'Permissions', href: '/admin/permissions', icon: '🔐' }
  ];
</script>

<AppShell user={data.user} {navItems}>
  {@render children()}
</AppShell>
```

**Step 3: Permissions page server**

Create `front-end/src/routes/admin/permissions/+page.server.ts`:
```typescript
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { graphql, GraphQLError } from '$lib/api/client';
import {
  USER_PERMISSIONS_QUERY,
  GRANT_PERMISSION_MUTATION,
  REVOKE_PERMISSION_MUTATION,
  TOGGLE_PERMISSION_MUTATION,
  DELETE_PERMISSION_MUTATION
} from '$lib/api/queries/permissions';
import type { UserPermissions } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const userId = url.searchParams.get('userId');
  const userType = url.searchParams.get('userType');

  let permissions: UserPermissions | null = null;

  if (userId && userType) {
    try {
      const data = await graphql<{ userPermissions: UserPermissions }>(
        USER_PERMISSIONS_QUERY,
        { userId, userType },
        locals.accessToken!
      );
      permissions = data.userPermissions;
    } catch (err) {
      if (err instanceof GraphQLError) {
        return { permissions: null, error: err.errors[0]?.message };
      }
    }
  }

  return { permissions, error: null };
};

export const actions: Actions = {
  grant: async ({ request, locals }) => {
    const formData = await request.formData();
    try {
      await graphql(
        GRANT_PERMISSION_MUTATION,
        {
          userId: formData.get('userId'),
          userType: formData.get('userType'),
          resource: formData.get('resource'),
          action: formData.get('action')
        },
        locals.accessToken!
      );
      return { success: 'Permission granted' };
    } catch {
      return fail(422, { error: 'Failed to grant permission' });
    }
  },
  revoke: async ({ request, locals }) => {
    const formData = await request.formData();
    try {
      await graphql(
        REVOKE_PERMISSION_MUTATION,
        {
          userId: formData.get('userId'),
          userType: formData.get('userType'),
          resource: formData.get('resource'),
          action: formData.get('action')
        },
        locals.accessToken!
      );
      return { success: 'Permission revoked' };
    } catch {
      return fail(422, { error: 'Failed to revoke permission' });
    }
  },
  toggle: async ({ request, locals }) => {
    const formData = await request.formData();
    try {
      await graphql(
        TOGGLE_PERMISSION_MUTATION,
        { id: formData.get('id') },
        locals.accessToken!
      );
      return { success: 'Permission toggled' };
    } catch {
      return fail(422, { error: 'Failed to toggle permission' });
    }
  },
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    try {
      await graphql(
        DELETE_PERMISSION_MUTATION,
        { id: formData.get('id') },
        locals.accessToken!
      );
      return { success: 'Permission deleted' };
    } catch {
      return fail(422, { error: 'Failed to delete permission' });
    }
  }
};
```

**Step 4: Permissions page UI**

Create `front-end/src/routes/admin/permissions/+page.svelte`:
```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { Card, Button, Alert, Badge } from '$lib/components/ui';

  let { data, form } = $props();
  let userId = $state('');
  let userType = $state('Teacher');

  function lookupUser() {
    if (userId) {
      goto(`/admin/permissions?userId=${userId}&userType=${userType}`, { replaceState: true });
    }
  }
</script>

<svelte:head>
  <title>Permissions — GrewMe</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
  <h1 class="text-2xl font-bold text-text mb-6">Permission Management</h1>

  {#if form?.success}
    <div class="mb-4">
      <Alert variant="success">{form.success}</Alert>
    </div>
  {/if}

  {#if form?.error || data.error}
    <div class="mb-4">
      <Alert variant="error">{form?.error || data.error}</Alert>
    </div>
  {/if}

  <!-- User Lookup -->
  <Card class="mb-6">
    {#snippet header()}
      <h2 class="text-lg font-semibold text-text">Look Up User</h2>
    {/snippet}
    <div class="flex gap-3 items-end">
      <div class="flex-1 space-y-1">
        <label class="block text-sm font-medium text-text" for="userId">User ID</label>
        <input
          id="userId"
          type="text"
          bind:value={userId}
          placeholder="Enter user ID..."
          class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div class="space-y-1">
        <label class="block text-sm font-medium text-text" for="userType">Type</label>
        <select
          id="userType"
          bind:value={userType}
          class="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="Teacher">Teacher</option>
          <option value="Parent">Parent</option>
        </select>
      </div>
      <Button onclick={lookupUser}>Look Up</Button>
    </div>
  </Card>

  <!-- Permissions Table -->
  {#if data.permissions}
    <Card>
      {#snippet header()}
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-text">
            Permissions for User #{data.permissions.userId}
          </h2>
          <Badge variant="primary">{data.permissions.role}</Badge>
        </div>
      {/snippet}

      <h3 class="text-sm font-semibold text-text-muted mb-3 mt-2">Effective Permissions</h3>
      <div class="overflow-x-auto -mx-6">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">Resource</th>
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">Action</th>
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">Granted</th>
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">Source</th>
            </tr>
          </thead>
          <tbody>
            {#each data.permissions.effective as perm}
              <tr class="border-b border-slate-50">
                <td class="px-6 py-2 text-sm text-text">{perm.resource}</td>
                <td class="px-6 py-2 text-sm text-text">{perm.action}</td>
                <td class="px-6 py-2">
                  <Badge variant={perm.granted ? 'success' : 'danger'}>
                    {perm.granted ? 'Yes' : 'No'}
                  </Badge>
                </td>
                <td class="px-6 py-2 text-sm text-text-muted">{perm.source}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if data.permissions.overrides.length > 0}
        <h3 class="text-sm font-semibold text-text-muted mb-3 mt-6">Permission Overrides</h3>
        <div class="space-y-2">
          {#each data.permissions.overrides as override}
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <span class="text-sm font-medium text-text">{override.resource}.{override.action}</span>
                <Badge variant={override.granted ? 'success' : 'danger'} class="ml-2">
                  {override.granted ? 'Granted' : 'Revoked'}
                </Badge>
              </div>
              <div class="flex gap-2">
                <form method="POST" action="?/toggle" use:enhance>
                  <input type="hidden" name="id" value={override.id} />
                  <Button variant="outline" size="sm" type="submit">Toggle</Button>
                </form>
                <form method="POST" action="?/delete" use:enhance>
                  <input type="hidden" name="id" value={override.id} />
                  <Button variant="danger" size="sm" type="submit">Delete</Button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card>
  {/if}
</div>
```

**Step 5: Commit**

```bash
git add front-end/src/routes/admin/
git commit -m "feat(frontend): add admin permission management page"
```

---

### Task 18: Error handling and loading states

**Files:**
- Create: `front-end/src/routes/+error.svelte`
- Create: `front-end/src/lib/components/ui/Skeleton.svelte`

**Step 1: Global error page**

Create `front-end/src/routes/+error.svelte`:
```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui';
</script>

<svelte:head>
  <title>Error — GrewMe</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="text-center">
    <h1 class="text-6xl font-bold text-primary mb-4">{page.status}</h1>
    <p class="text-xl text-text mb-2">
      {#if page.status === 404}
        Page not found
      {:else if page.status === 403}
        Access denied
      {:else}
        Something went wrong
      {/if}
    </p>
    <p class="text-text-muted mb-8">{page.error?.message ?? 'An unexpected error occurred.'}</p>
    <div class="flex gap-3 justify-center">
      <Button onclick={() => history.back()} variant="outline">Go Back</Button>
      <a href="/"><Button>Home</Button></a>
    </div>
  </div>
</div>
```

**Step 2: Skeleton loading component**

Create `front-end/src/lib/components/ui/Skeleton.svelte`:
```svelte
<script lang="ts">
  interface Props {
    class?: string;
    lines?: number;
  }

  let { class: className = 'h-4 w-full', lines = 1 }: Props = $props();
</script>

{#each Array(lines) as _}
  <div class="animate-pulse bg-slate-200 rounded {className}"></div>
{/each}
```

Update `front-end/src/lib/components/ui/index.ts` to add Skeleton export:
```typescript
export { default as Button } from './Button.svelte';
export { default as Card } from './Card.svelte';
export { default as Input } from './Input.svelte';
export { default as Alert } from './Alert.svelte';
export { default as Badge } from './Badge.svelte';
export { default as Skeleton } from './Skeleton.svelte';
```

**Step 3: Commit**

```bash
git add front-end/
git commit -m "feat(frontend): add error page and skeleton loading component"
```

---

### Task 19: Add .env to .gitignore and final cleanup

**Files:**
- Modify: `.gitignore`

**Step 1: Add front-end .env to gitignore**

Add to root `.gitignore`:
```
front-end/.env
front-end/.env.local
```

**Step 2: Run type check**

Run: `cd front-end && npm run check`

Fix any TypeScript errors that appear.

**Step 3: Run build**

Run: `cd front-end && npm run build`

Fix any build errors.

**Step 4: Commit**

```bash
git add .
git commit -m "chore(frontend): add .env to gitignore and fix any type errors"
```

---

## Summary

| Phase | Tasks | Commits | Pages |
|-------|-------|---------|-------|
| 1: Foundation | Tasks 1-9 | 9 | Login, Register |
| 2: Teacher | Tasks 10-14 | 5 | Dashboard, Classroom, Student, Scores |
| 3: Parent | Tasks 15-16 | 2 | Dashboard, Child Detail |
| 4: Admin + Polish | Tasks 17-19 | 3 | Permissions, Error page |
| **Total** | **19 tasks** | **19 commits** | **9 pages** |

### Verification after each phase:
1. `cd front-end && npm run check` — TypeScript passes
2. `cd front-end && npm run build` — Build succeeds
3. `cd front-end && npm run dev` — Manual smoke test in browser
4. `cd backend && bin/rails test` — Backend tests still pass (111 tests)
