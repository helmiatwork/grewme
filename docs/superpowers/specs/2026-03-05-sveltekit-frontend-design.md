# Design: SvelteKit Frontend MVP

**Date**: 2026-03-05
**Status**: Approved
**Scope**: Full MVP — all 9 pages, auth, radar charts, role-based routing

---

## Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | SvelteKit | 2.50+ |
| UI | Svelte 5 | 5.51+ (runes mode) |
| CSS | Tailwind CSS | v4 |
| Charts | Chart.js + svelte-chartjs | latest |
| Auth | HttpOnly cookies via SvelteKit BFF proxy | — |
| Build | Vite | 7.3+ |
| Language | TypeScript | strict |

---

## Architecture

### Directory Structure

```
front-end/src/
├── lib/
│   ├── api/
│   │   ├── client.ts               # Server-side GraphQL fetch wrapper
│   │   ├── queries/
│   │   │   ├── auth.ts             # login, register, refreshToken, logout
│   │   │   ├── classrooms.ts       # classrooms, classroom, classroomOverview
│   │   │   ├── students.ts         # student, studentRadar, studentProgress, studentDailyScores
│   │   │   ├── parents.ts          # myChildren
│   │   │   └── permissions.ts      # userPermissions, grant/revoke/toggle/delete
│   │   └── types.ts                # TypeScript types matching GraphQL schema
│   ├── components/
│   │   ├── ui/                     # Button, Card, Input, Modal, Badge, Alert
│   │   ├── charts/
│   │   │   ├── RadarChart.svelte   # MLBB-style skill radar (Chart.js)
│   │   │   └── ProgressChart.svelte # Weekly progress line/bar chart
│   │   ├── layout/
│   │   │   ├── Sidebar.svelte      # Role-aware navigation sidebar
│   │   │   ├── Navbar.svelte       # Top bar with user info + logout
│   │   │   └── RoleBadge.svelte    # Teacher/Parent/Admin badge
│   │   └── forms/
│   │       ├── LoginForm.svelte
│   │       ├── RegisterForm.svelte
│   │       └── ScoreEntryForm.svelte
│   ├── stores/
│   │   └── auth.svelte.ts          # Svelte 5 runes: $state for current user
│   └── utils/
│       ├── constants.ts            # Skill categories, colors, labels
│       └── helpers.ts              # Date formatting, score helpers
├── routes/
│   ├── +layout.svelte              # Root: Tailwind globals, font loading
│   ├── +layout.server.ts           # Root load: check auth, populate user
│   ├── +page.svelte                # Landing → redirect to role dashboard
│   ├── login/
│   │   ├── +page.svelte            # Login form
│   │   └── +page.server.ts         # Form action: call /api/auth/login
│   ├── register/
│   │   ├── +page.svelte            # Register form
│   │   └── +page.server.ts         # Form action: call /api/auth/register
│   ├── teacher/
│   │   ├── +layout.svelte          # Teacher shell: sidebar + nav
│   │   ├── +layout.server.ts       # Guard: role === 'teacher'
│   │   ├── dashboard/
│   │   │   ├── +page.svelte        # Classrooms grid
│   │   │   └── +page.server.ts     # Load: classrooms query
│   │   ├── classrooms/[id]/
│   │   │   ├── +page.svelte        # Classroom detail + student list + overview radar
│   │   │   └── +page.server.ts     # Load: classroom + classroomOverview
│   │   ├── students/[id]/
│   │   │   ├── +page.svelte        # Student radar + progress + daily scores
│   │   │   └── +page.server.ts     # Load: studentRadar + studentProgress + studentDailyScores
│   │   └── scores/
│   │       ├── +page.svelte        # Daily score entry form
│   │       └── +page.server.ts     # Form action: createDailyScore / updateDailyScore
│   ├── parent/
│   │   ├── +layout.svelte          # Parent shell: sidebar + nav
│   │   ├── +layout.server.ts       # Guard: role === 'parent'
│   │   ├── dashboard/
│   │   │   ├── +page.svelte        # Children cards with mini radars
│   │   │   └── +page.server.ts     # Load: myChildren
│   │   └── children/[id]/
│   │       ├── +page.svelte        # Child radar + progress (read-only)
│   │       └── +page.server.ts     # Load: studentRadar + studentProgress
│   └── admin/
│       ├── +layout.server.ts       # Guard: admin permissions
│       └── permissions/
│           ├── +page.svelte        # Permission management table
│           └── +page.server.ts     # Load: userPermissions + mutations
├── hooks.server.ts                 # Auth middleware: parse cookie → locals.user
└── api/                            # SvelteKit server routes (BFF)
    ├── auth/
    │   ├── login/+server.ts        # POST → Rails login mutation → set cookies
    │   ├── register/+server.ts     # POST → Rails register mutation → set cookies
    │   ├── refresh/+server.ts      # POST → Rails refreshToken → update cookies
    │   └── logout/+server.ts       # POST → Rails logout → clear cookies
    └── graphql/+server.ts          # POST → proxy to Rails with JWT from cookie
```

---

## Auth Flow (BFF Pattern)

```
┌─────────┐     HttpOnly Cookie      ┌──────────────┐    Bearer JWT     ┌─────────────┐
│ Browser  │ ◄──────────────────────► │ SvelteKit    │ ◄──────────────► │ Rails API   │
│ (Svelte) │   (no JS token access)  │ Server       │   (server-only)  │ (GraphQL)   │
└─────────┘                          └──────────────┘                   └─────────────┘
```

### Login Flow
1. User submits login form → SvelteKit form action (`+page.server.ts`)
2. Server calls Rails `login` mutation via GraphQL
3. Rails returns `{ accessToken, refreshToken, user }`
4. SvelteKit sets two HttpOnly cookies:
   - `grewme_access` — short-lived (matches JWT exp)
   - `grewme_refresh` — longer-lived
5. Redirects to role-based dashboard (`/teacher/dashboard` or `/parent/dashboard`)

### Request Flow
1. Browser makes page request
2. `hooks.server.ts` reads `grewme_access` cookie
3. Decodes JWT payload (without verification — Rails verifies) to get user info
4. Sets `event.locals.user = { id, type, email }`
5. Layout server loads pass user to pages
6. GraphQL requests go through `/api/graphql` server route which attaches Bearer token

### Token Refresh
1. If access token expired, `hooks.server.ts` detects it
2. Calls Rails `refreshToken` mutation with refresh token
3. Updates both cookies with new tokens
4. Continues request normally

### Route Guards
- `teacher/+layout.server.ts` — checks `locals.user.type === 'Teacher'`, redirects to `/login` if not
- `parent/+layout.server.ts` — checks `locals.user.type === 'Parent'`, redirects to `/login` if not
- `admin/+layout.server.ts` — checks admin permissions (TBD: may need a `me` query with permissions)

---

## Visual Design

### Theme: Playful & Colorful

**Color Palette**:
- Primary: `#3B82F6` (blue-500)
- Secondary: `#8B5CF6` (violet-500)
- Background: `#F8FAFC` (slate-50)
- Surface: `#FFFFFF`
- Text: `#1E293B` (slate-800)

**Skill Category Colors** (used in radar chart + UI):
| Skill | Color | Tailwind |
|-------|-------|----------|
| Reading | `#10B981` | emerald-500 |
| Math | `#F59E0B` | amber-500 |
| Writing | `#8B5CF6` | violet-500 |
| Logic | `#06B6D4` | cyan-500 |
| Social | `#F43F5E` | rose-500 |

**Design Tokens**:
- Border radius: `rounded-xl` (cards), `rounded-lg` (buttons/inputs)
- Shadows: `shadow-sm` (cards), `shadow-md` (modals)
- Font: Inter (body) or Nunito (headings) — playful but readable
- Spacing: generous padding, 4-8px gaps
- Cards: white bg, subtle border, colored left accent for skill categories

### Radar Chart (Hero Feature)
- Chart.js radar type with custom styling
- Filled area with 20% opacity of skill color
- Animated on load (scale from center)
- 5 axes: Reading, Math, Writing, Logic, Social
- Score range: 0-100
- Grid lines: light gray, 5 levels (20, 40, 60, 80, 100)
- Point labels with skill icons/emojis
- Optional: subtle glow/shadow effect on the filled area

---

## Pages Detail

### 1. Login (`/login`)
- Centered card with logo
- Email + password fields
- Role selector (Teacher / Parent) — determines which model to auth against
- "Don't have an account? Register" link
- Form action → `/api/auth/login`

### 2. Register (`/register`)
- Similar to login + name field
- Role selector (Teacher / Parent)
- Form action → `/api/auth/register`

### 3. Teacher Dashboard (`/teacher/dashboard`)
- Grid of classroom cards
- Each card: classroom name, student count, school name
- Click → `/teacher/classrooms/[id]`

### 4. Classroom Detail (`/teacher/classrooms/[id]`)
- Classroom info header
- Class-wide radar overview (average scores)
- Student list table with mini radar thumbnails
- Click student → `/teacher/students/[id]`

### 5. Student Detail (`/teacher/students/[id]`)
- Student info header
- **Radar chart** (main feature) — full-size, animated
- Progress chart — weekly trends per skill
- Daily scores table — filterable by skill category
- "Add Score" button → score entry form/modal

### 6. Daily Score Entry (`/teacher/scores`)
- Select classroom → select student
- Date picker (defaults to today)
- Skill category selector (5 options with colored chips)
- Score slider/input (0-100)
- Submit → `createDailyScore` mutation
- Success feedback with option to add another

### 7. Parent Dashboard (`/parent/dashboard`)
- Children cards with mini radar charts
- Each card: child name, latest scores summary
- Click → `/parent/children/[id]`

### 8. Child Detail (`/parent/children/[id]`)
- Same as Student Detail but read-only (no "Add Score" button)
- Radar chart + progress chart + daily scores

### 9. Permission Management (`/admin/permissions`)
- Search/select user (teacher or parent)
- Table of current permissions (resource × action grid)
- Toggle switches for each permission
- Grant/revoke buttons
- Uses `userPermissions` query + grant/revoke/toggle/delete mutations

---

## GraphQL Client

### Server-Side Only
All GraphQL calls happen on the SvelteKit server (in `+page.server.ts` load functions and form actions). The browser never directly calls Rails.

### Client Implementation
```typescript
// lib/api/client.ts
const GRAPHQL_URL = env.RAILS_GRAPHQL_URL || 'http://localhost:3000/graphql';

export async function graphql<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new GraphQLError(json.errors);
  }
  return json.data as T;
}
```

No external GraphQL client library needed — plain `fetch` is sufficient for server-side usage.

---

## Environment Variables

```env
# front-end/.env
RAILS_GRAPHQL_URL=http://localhost:3000/graphql
COOKIE_SECRET=<random-secret-for-cookie-signing>
PUBLIC_APP_NAME=GrewMe
```

---

## Implementation Phases

### Phase 1: Foundation (auth + layout)
- Install Tailwind CSS v4
- Set up BFF auth proxy (login/register/logout/refresh)
- `hooks.server.ts` auth middleware
- Root layout with Tailwind
- Login + Register pages
- Role-based route guards

### Phase 2: Teacher Flow
- Teacher layout (sidebar + nav)
- Teacher dashboard (classrooms grid)
- Classroom detail page
- Student detail page with radar chart
- Daily score entry form

### Phase 3: Parent Flow
- Parent layout (sidebar + nav)
- Parent dashboard (children cards)
- Child detail page (read-only radar + progress)

### Phase 4: Admin + Polish
- Permission management page
- Error handling (toast notifications, error boundaries)
- Loading states (skeletons)
- Responsive design (mobile-friendly)
- Accessibility basics (ARIA, keyboard nav)

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CSS Framework | Tailwind v4 | Best Svelte ecosystem support, rapid prototyping |
| Auth | HttpOnly cookies via BFF | Most secure, no JS token exposure |
| Charts | Chart.js + svelte-chartjs | Built-in radar type, good Svelte wrapper |
| GraphQL client | Plain fetch | Server-side only, no need for Apollo/urql overhead |
| Routing | Separate route groups per role | Clean URLs, server-side guards, clear separation |
| Theme | Playful & Colorful | Fits kids education app context |
| State | Svelte 5 runes ($state) | Modern, no external store library needed |
