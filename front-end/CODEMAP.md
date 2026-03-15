# GrewMe Frontend Codemap

**Project**: GrewMe — Kids Learning Radar App  
**Framework**: SvelteKit 2.50.2 + Vite 7.3.1  
**Deployment**: Vercel (adapter-vercel)  
**Language**: TypeScript 5.9.3 + Svelte 5.51.0  
**Styling**: Tailwind CSS 4.2.1  
**i18n**: Paraglide JS 2.13.2  

---

## 1. Project Overview

### Purpose
GrewMe is a multi-role educational platform featuring:
- **Teacher Dashboard**: Manage classrooms, students, exams, curriculum, attendance, leave requests
- **Parent Dashboard**: Monitor children's progress via skill radar charts, view feed posts, manage leave requests
- **School Manager Dashboard**: Manage school settings, academic years, permissions
- **Skill Radar Charts**: MLBB-style radar visualization (Reading, Math, Writing, Logic, Social)
- **Real-time Notifications**: ActionCable WebSocket integration for live updates
- **Internationalization**: Multi-language support via Paraglide

### Key Features
1. **Authentication**: JWT-based (access + refresh tokens), role-based access control
2. **GraphQL API**: Communicates with Rails 8.1.2 backend
3. **Real-time Updates**: ActionCable WebSocket for notifications
4. **Responsive UI**: Tailwind CSS with custom components
5. **Data Visualization**: D3.js + LayerCake for radar and progress charts
6. **File Upload**: Support for media attachments in feed posts
7. **Exam System**: Multiple exam types (score-based, multiple choice, rubric, pass/fail)

### Entry Points
- **Root**: `/src/routes/+page.svelte` → Redirects to role-specific dashboard
- **Login**: `/src/routes/login/+page.server.ts` → JWT authentication
- **Teacher Dashboard**: `/src/routes/teacher/dashboard/+page.server.ts`
- **Parent Dashboard**: `/src/routes/parent/dashboard/+page.server.ts`
- **School Manager Dashboard**: `/src/routes/school/dashboard/+page.server.ts`

### Key Dependencies
```json
{
  "@sveltejs/kit": "^2.50.2",
  "@inlang/paraglide-js": "^2.13.2",
  "@rails/actioncable": "^8.1.200",
  "@tailwindcss/vite": "^4.2.1",
  "d3-scale": "^4.0.2",
  "d3-shape": "^3.2.0",
  "layercake": "^10.0.2",
  "firebase": "^12.10.0",
  "svelte-dnd-action": "^0.9.69",
  "emoji-picker-element": "^1.29.1"
}
```

---

## 2. Architecture Overview

### Data Flow
```
User Action (UI)
    ↓
Form Action / Event Handler
    ↓
GraphQL Query/Mutation (via $lib/api/client.ts)
    ↓
Rails Backend (GraphQL endpoint)
    ↓
Response → Store/State Update
    ↓
Component Re-render (Svelte reactivity)
```

### Authentication Flow
```
Login Form
    ↓
POST /api/auth/login (form action)
    ↓
GraphQL LOGIN_MUTATION
    ↓
Rails returns: accessToken, refreshToken, expiresIn, user
    ↓
setAuthCookies() → Store in httpOnly cookies
    ↓
Redirect to role-specific dashboard
    ↓
On subsequent requests:
  - hooks.server.ts checks token expiration
  - If expired: REFRESH_TOKEN_MUTATION
  - If refresh fails: clearAuthCookies() → redirect to /login
```

### Real-time Notifications
```
User logs in
    ↓
connectNotifications(accessToken, cableUrl)
    ↓
ActionCable WebSocket connection to NotificationsChannel
    ↓
Server sends: { type: 'new_notification', notification: {...} }
    ↓
translateNotification() → Paraglide i18n
    ↓
addToast() → Show notification UI
    ↓
Update notifications store
```

### Component Hierarchy
```
+layout.svelte (root)
  ├─ ToastContainer (global toast notifications)
  └─ +page.svelte (redirect logic)
      └─ AppShell (authenticated routes)
          ├─ Sidebar (navigation)
          ├─ Navbar (user menu, notifications, language switcher)
          └─ main (page content)
              └─ Route-specific pages
                  ├─ Dashboard pages
                  ├─ Detail pages (student, exam, etc.)
                  └─ Form pages (create/edit)
```

---

## 3. Directory Structure & Responsibilities

### `/src/routes` — SvelteKit Routes (61 pages, 57 server loads)

#### Root Routes
- **`+layout.svelte`**: Global layout, imports app.css, renders ToastContainer
- **`+page.svelte`**: Redirect logic (Teacher → /teacher/dashboard, Parent → /parent/dashboard)
- **`+layout.server.ts`**: Loads user from locals

#### Authentication Routes
- **`/login`**: Login form with role selection (Teacher/Parent/SchoolManager)
  - `+page.server.ts`: Handles login form action, sets auth cookies
- **`/register`**: User registration
- **`/api/auth/`**: Server-side auth endpoints
  - `login/+server.ts`: GraphQL login mutation
  - `logout/+server.ts`: Clear cookies
  - `refresh/+server.ts`: Token refresh
  - `register/+server.ts`: User registration

#### Teacher Routes (`/teacher`)
- **`+layout.server.ts`**: Role guard (must be Teacher), loads accessToken + cableUrl
- **`dashboard/`**: List classrooms
- **`classrooms/[id]/`**: Classroom detail, student list
- **`students/[id]/`**: Student profile with radar chart, progress chart, daily scores
  - `health/`: Health checkup records
- **`curriculum/`**: Subject/topic management
  - `[subjectId]/`: Subject detail
  - `[subjectId]/[topicId]/`: Topic detail with learning objectives
  - `yearly/`: Grade curriculum view
- **`exams/`**: Exam management
  - `[examId]/`: Exam detail, assign to classrooms
  - `[examId]/grade/`: Grading interface
  - `[examId]/grade/[submissionId]/`: Grade individual submission
  - `new/`: Create new exam
- **`attendance/`**: Attendance tracking
- **`calendar/`**: Classroom events
- **`feed/`**: Classroom feed posts
- **`messages/`**: Messaging interface
- **`leave-requests/`**: Manage student leave requests
- **`my-leave/`**: Teacher's own leave requests
- **`profile/`**: Teacher profile settings
- **`teacher-leave/`**: Approve/reject teacher leave requests
- **`settings/`**: School settings (academic years, etc.)
- **`onboarding/`**: Initial setup

#### Parent Routes (`/parent`)
- **`+layout.server.ts`**: Role guard (must be Parent), loads accessToken + cableUrl
- **`dashboard/`**: List children with radar charts, feed posts
- **`children/[id]/`**: Child profile
  - `attendance/`: Child's attendance records
  - `exams/`: Child's exam results
  - `health/`: Child's health records
- **`curriculum/`**: View curriculum
  - `[subjectId]/`: Subject detail
  - `[subjectId]/[topicId]/`: Topic detail
  - `yearly/`: Grade curriculum
- **`calendar/`**: Classroom events
- **`messages/`**: Messaging
- **`leave-requests/`**: Manage child leave requests
- **`profile/`**: Parent profile
- **`data-rights/`**: Data privacy/consent management

#### School Manager Routes (`/school`)
- **`+layout.server.ts`**: Role guard (must be SchoolManager)
- **`dashboard/`**: School overview
- **`students/`**: Manage students
- **`teachers/`**: Manage teachers
- **`classrooms/`**: Manage classrooms
- **`curriculum/`**: Manage curriculum
- **`exams/`**: Manage exams
- **`attendance/`**: School-wide attendance
- **`calendar/`**: School calendar
- **`feed/`**: School feed
- **`profile/`**: School profile
- **`settings/`**: School settings
  - `academic-years/`: Manage academic years
- **`onboarding/`**: School setup

#### Admin Routes (`/admin`)
- **`+layout.server.ts`**: Admin-only access
- **`permissions/`**: Manage user permissions

#### Public Routes
- **`/consent/[token]/`**: Consent form (email token)
- **`/invite/[token]/`**: Invitation acceptance (email token)
- **`/exam/[code]/`**: Kahoot-style exam access (public, no auth)
- **`/posts/[id]/`**: Public feed post view
- **`/privacy`**: Privacy policy
- **`/terms`**: Terms of service

---

### `/src/lib/api` — GraphQL Client & Queries

#### Core Files
- **`client.ts`**: GraphQL fetch wrapper
  - `graphql<T>(query, variables?, token?)`: Execute GraphQL query/mutation
  - `GraphQLError`: Custom error class for GraphQL errors
  - Uses `RAILS_GRAPHQL_URL` env var (default: http://localhost:3000/graphql)

- **`auth.ts`**: Authentication utilities
  - `setAuthCookies()`: Store access/refresh tokens in httpOnly cookies
  - `clearAuthCookies()`: Delete auth cookies
  - `getAccessToken()`, `getRefreshToken()`, `getRole()`: Read cookies
  - `decodeJwtPayload()`: Decode JWT without verification (Rails verifies)
  - `isTokenExpired()`: Check if token expired (with 30s buffer)

- **`types.ts`**: TypeScript interfaces (466 lines)
  - User types: `Teacher`, `Parent`, `SchoolManager`
  - Auth: `AuthPayload`, `LogoutPayload`
  - Data: `Classroom`, `Student`, `DailyScore`, `RadarSkills`, `RadarData`
  - Exams: `Exam`, `ExamQuestion`, `ExamSubmission`, `ClassroomExam`
  - Curriculum: `Subject`, `Topic`, `LearningObjective`
  - Feed: `FeedPost`, `FeedPostComment`, `MediaAttachment`
  - Pagination: `Connection<T>`, `PageInfo` (Relay-style)
  - Permissions: `Permission`, `EffectivePermission`, `UserPermissions`

- **`upload.ts`**: File upload utilities (Firebase or backend)

#### GraphQL Queries (`/queries`)
- **`auth.ts`**: LOGIN_MUTATION, REFRESH_TOKEN_MUTATION, LOGOUT_MUTATION
- **`classrooms.ts`**: CLASSROOMS_QUERY, CLASSROOM_QUERY, CLASSROOM_OVERVIEW_QUERY
- **`students.ts`**: STUDENT_RADAR_QUERY, STUDENT_PROGRESS_QUERY, STUDENT_DAILY_SCORES_QUERY
- **`curriculum.ts`**: SUBJECTS_QUERY, SUBJECT_QUERY, TOPIC_QUERY, EXAM_QUERY, ASSIGN_EXAM_MUTATION
- **`exam.ts`**: EXAM_SUBMISSIONS_QUERY, SUBMIT_EXAM_MUTATION, GRADE_SUBMISSION_MUTATION
- **`feed.ts`**: FEED_POSTS_QUERY, CREATE_POST_MUTATION, LIKE_POST_MUTATION, COMMENT_MUTATION
- **`calendar.ts`**: CLASSROOM_EVENTS_QUERY, CREATE_EVENT_MUTATION
- **`attendance.ts`**: ATTENDANCE_RECORDS_QUERY, MARK_ATTENDANCE_MUTATION
- **`profile.ts`**: UPDATE_PROFILE_MUTATION, CHANGE_PASSWORD_MUTATION
- **`permissions.ts`**: USER_PERMISSIONS_QUERY, UPDATE_PERMISSIONS_MUTATION
- **`parents.ts`**: MY_CHILDREN_QUERY
- **`health-checkups.ts`**: HEALTH_CHECKUPS_QUERY
- **`data-rights.ts`**: DATA_RIGHTS_QUERY
- **`onboarding.ts`**: ONBOARDING_STATUS_QUERY
- **`invitations.ts`**: ACCEPT_INVITATION_MUTATION
- **`consent.ts`**: ACCEPT_CONSENT_MUTATION
- **`school.ts`**: SCHOOL_QUERY, UPDATE_SCHOOL_MUTATION

---

### `/src/lib/stores` — Svelte Stores (Reactive State)

#### Files
- **`notifications.svelte.ts`** (289 lines): Real-time notifications via ActionCable
  - `connectNotifications(accessToken, cableUrl)`: Establish WebSocket connection
  - `getNotifications()`: Get reactive notifications state
  - `translateNotification(notif)`: Translate notification using Paraglide
  - `setInitialNotifications()`: Hydrate from server
  - Auto-reconnect with exponential backoff (max 10 attempts)
  - Notification kinds: leave_request_created, exam_submitted, feed_post_tagged, etc.

- **`toasts.svelte.ts`**: Toast notifications (success, error, info)
  - `addToast()`: Show temporary toast message
  - `removeToast()`: Dismiss toast

- **`push.svelte.ts`**: Push notification setup (Firebase)

---

### `/src/lib/components` — Reusable UI Components

#### Layout Components (`/layout`)
- **`AppShell.svelte`**: Main layout wrapper
  - Props: `user: SessionUser`, `navItems: NavItem[]`, `children: Snippet`
  - Renders: Sidebar + Navbar + main content area
  - Flex layout: sidebar (fixed) + main (flex-1)

- **`Navbar.svelte`** (180 lines): Top navigation bar
  - User menu (logout, profile)
  - Notification bell with dropdown
  - Language switcher (Paraglide locales)
  - Unread notification count badge
  - Notification translation + toast integration

- **`Sidebar.svelte`**: Left navigation sidebar
  - Dynamic nav items based on role
  - Active route highlighting

#### UI Components (`/ui`)
- **`Button.svelte`**: Styled button with variants (primary, secondary, danger)
- **`Card.svelte`**: Container component with optional hover effect
- **`Input.svelte`**: Text input with label
- **`Alert.svelte`**: Alert box (info, warning, error)
- **`Badge.svelte`**: Small label/tag
- **`Toast.svelte`**: Toast notification display
- **`ToastContainer.svelte`**: Global toast container (rendered in root layout)
- **`Skeleton.svelte`**: Loading placeholder

#### Chart Components (`/charts`)
- **`RadarChart.svelte`** (53 lines): Skill radar visualization
  - Uses LayerCake + D3 for rendering
  - Props: `skills: RadarSkills`, `label?: string`, `size?: 'sm' | 'md' | 'lg'`
  - Displays 5 skills: Reading, Math, Writing, Logic, Social
  - Color-coded by skill (from constants.ts)
  - Domain: 0-100 scale

- **`ProgressChart.svelte`** (121 lines): Weekly progress line chart
  - Uses D3 scales (scaleLinear, scalePoint) + d3-shape (line, curveMonotoneX)
  - Props: `progress: ProgressData` (weeks array)
  - Renders: 5 skill lines with dots, Y-axis grid, legend
  - Responsive SVG with Tailwind sizing

- **`_radar/AxisRadial.svelte`**: Radial axis for radar chart
- **`_radar/RadarArea.svelte`**: Filled area for radar chart

#### Feed Components (`/feed`)
- **`FeedCard.svelte`** (4765 bytes): Display feed post
  - Shows: post body, media attachments, tagged students, likes, comments
  - Actions: like, comment, delete (if owner)
  - Integrates with CommentSection

- **`CommentSection.svelte`**: Display + add comments
- **`FilePicker.svelte`**: File upload UI
- **`MediaGallery.svelte`**: Display media attachments

---

### `/src/lib/utils` — Utility Functions

- **`constants.ts`** (35 lines): Skill-related constants
  - `SKILL_CATEGORIES`: ['READING', 'MATH', 'WRITING', 'LOGIC', 'SOCIAL']
  - `SKILL_LABELS`: Human-readable names
  - `SKILL_COLORS`: Hex colors for charts
  - `SKILL_BG_COLORS`: Tailwind classes for badges
  - `SKILL_EMOJIS`: Emoji representations

- **`helpers.ts`**: Date formatting, string utilities
- **`grade.ts`**: Grade/score calculations

---

### `/src/lib/paraglide` — Internationalization (i18n)

#### Generated Files (by Paraglide Vite plugin)
- **`messages.js`**: Exported message functions
  - Usage: `import * as m from '$lib/paraglide/messages.js'`
  - Example: `m.teacher_dashboard_title()`, `m.notif_leave_request_created_title()`
  - Supports parameterized messages: `m.notif_leave_request_created_body({ parentName, requestType, ... })`

- **`runtime.js`**: Paraglide runtime (locale switching, message resolution)
  - `getLocale()`: Get current locale
  - `setLocale(locale)`: Switch language
  - `locales`: Available locales array

- **`server.js`**: Server-side middleware for locale detection
  - Integrated in `hooks.server.ts` via `paraglideMiddleware()`

- **`messages/`**: Message definitions (auto-generated from project.inlang)
  - Organized by feature: common, teacher, parent, notifications, etc.

#### Configuration
- **`project.inlang/`**: Paraglide project config
  - Defines languages, message structure, translation workflow

---

### `/src` — Root Files

- **`hooks.server.ts`** (115 lines): Server-side middleware
  - **Paraglide Integration**: Locale detection + message resolution
  - **Authentication Flow**:
    1. Check access token in cookies
    2. If expired/missing: attempt refresh with refresh token
    3. Decode JWT payload → extract user info
    4. Store in `event.locals.user` and `event.locals.accessToken`
  - **Route Guards**:
    - Redirect unauthenticated users to /login
    - Redirect authenticated users away from /login (unless ?force param)
    - Role-based guards: /teacher → Teacher only, /parent → Parent only, /school → SchoolManager only
  - **Public Paths**: /login, /register, /api/

- **`app.css`**: Global styles (Tailwind imports, custom CSS variables)

- **`+layout.svelte`**: Root layout
  - Imports app.css
  - Renders ToastContainer (global)
  - Renders children

- **`+page.svelte`**: Root page
  - Redirect logic based on user type
  - Shows loading spinner while redirecting

---

## 4. Design Patterns & Key Concepts

### 1. Server-Side Load Functions
**Pattern**: Fetch data on server, pass to component via `data` prop
```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ locals, params }) => {
  const data = await graphql<T>(QUERY, variables, locals.accessToken!);
  return { data };
};

// +page.svelte
let { data } = $props();
```
**Benefits**: 
- Data fetched before page renders (no loading states)
- Access token available server-side (secure)
- Automatic error handling via SvelteKit

### 2. Form Actions
**Pattern**: Handle form submissions server-side
```typescript
// +page.server.ts
export const actions: Actions = {
  default: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    // Validate, call GraphQL, return result
    return { success: true } or fail(status, { error: '...' });
  }
};

// +page.svelte
<form method="POST">
  <input name="field" />
  <button type="submit">Submit</button>
</form>
```
**Benefits**: Progressive enhancement, CSRF protection, server-side validation

### 3. Reactive Stores (Svelte 5)
**Pattern**: Use `.svelte.ts` files for reactive state
```typescript
// notifications.svelte.ts
let notifications = $state<Notification[]>([]);
let unreadCount = $state(0);

export function getNotifications() {
  return {
    get items() { return notifications; },
    get unreadCount() { return unreadCount; }
  };
}

// Component
const notifs = getNotifications();
// Auto-updates when notifications change
```
**Benefits**: Fine-grained reactivity, no boilerplate, type-safe

### 4. Role-Based Access Control (RBAC)
**Pattern**: Guard routes in hooks.server.ts
```typescript
if (user && url.pathname.startsWith('/teacher') && user.type !== 'Teacher') {
  throw redirect(303, getDashboard(user.type));
}
```
**Roles**: Teacher, Parent, SchoolManager

### 5. GraphQL Query Organization
**Pattern**: Centralize queries in `/lib/api/queries/`
```typescript
// queries/classrooms.ts
export const CLASSROOMS_QUERY = `query Classrooms { ... }`;

// +page.server.ts
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
const data = await graphql<T>(CLASSROOMS_QUERY, {}, token);
```
**Benefits**: Reusable, testable, DRY

### 6. Paraglide i18n Integration
**Pattern**: Use message functions for all user-facing text
```typescript
import * as m from '$lib/paraglide/messages.js';

// In component
<h1>{m.teacher_dashboard_title()}</h1>
<p>{m.notif_leave_request_created_body({ parentName, requestType })}</p>

// In Navbar
<button onclick={() => setLocale('en')}>English</button>
```
**Benefits**: Single source of truth for translations, type-safe message params

### 7. Real-time Notifications via ActionCable
**Pattern**: WebSocket subscription in store
```typescript
// notifications.svelte.ts
export function connectNotifications(accessToken, cableUrl) {
  const consumer = createConsumer(wsUrl);
  subscription = consumer.subscriptions.create('NotificationsChannel', {
    received(data) {
      notifications = [data.notification, ...notifications];
      addToast({ title, body });
    }
  });
}

// Component
onMount(() => {
  connectNotifications(accessToken, cableUrl);
});
```
**Benefits**: Real-time updates, automatic reconnection with backoff

### 8. Skill Radar Visualization
**Pattern**: LayerCake + D3 for data-driven charts
```typescript
// RadarChart.svelte
const data = [{ reading: 80, math: 75, ... }];
<LayerCake x={['reading', 'math', ...]} xDomain={[0, 100]} {data}>
  <Svg>
    <AxisRadial />
    <RadarArea />
  </Svg>
</LayerCake>
```
**Benefits**: Responsive, reusable, composable chart components

---

## 5. Data & Control Flow Examples

### Example 1: Teacher Views Student Progress
```
Teacher clicks "Students" → /teacher/students
  ↓
+layout.server.ts checks: user.type === 'Teacher' ✓
  ↓
+page.server.ts loads: CLASSROOMS_QUERY
  ↓
+page.svelte renders: list of students
  ↓
Teacher clicks student → /teacher/students/[id]
  ↓
+page.server.ts loads (parallel):
  - STUDENT_RADAR_QUERY → RadarData
  - STUDENT_PROGRESS_QUERY → ProgressData
  - STUDENT_DAILY_SCORES_QUERY → DailyScore[]
  ↓
+page.svelte renders:
  - RadarChart (skills visualization)
  - ProgressChart (weekly trend)
  - Daily scores table
```

### Example 2: Parent Receives Notification
```
Rails backend: Student submitted exam
  ↓
ActionCable broadcasts to NotificationsChannel
  ↓
notifications.svelte.ts received() callback:
  - Add notification to store
  - translateNotification() → Paraglide
  - addToast() → show UI
  ↓
Navbar re-renders:
  - unreadCount badge updates
  - Notification appears in dropdown
  ↓
Parent clicks notification → navigates to relevant page
```

### Example 3: Teacher Creates Exam
```
Teacher navigates to /teacher/exams/new
  ↓
+page.svelte renders: exam creation form
  ↓
Teacher fills form, clicks "Create"
  ↓
Form action (default): 
  - Validate input
  - Call CREATE_EXAM_MUTATION
  - Return { success: true } or fail()
  ↓
If success: redirect to /teacher/exams/[examId]
  ↓
+page.server.ts loads: EXAM_QUERY
  ↓
+page.svelte renders: exam detail with assign options
```

---

## 6. Integration Points & Dependencies

### Backend Integration
- **GraphQL Endpoint**: `RAILS_GRAPHQL_URL` (default: http://localhost:3000/graphql)
- **Auth Endpoints**: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`
- **WebSocket**: `RAILS_CABLE_URL` (default: ws://localhost:3004/cable)
- **File Upload**: Firebase or backend endpoint

### External Services
- **Firebase**: Push notifications, file storage
- **Paraglide**: i18n message management (project.inlang)
- **Vercel**: Deployment platform

### Component Dependencies
- **LayerCake**: Chart composition framework
- **D3**: Data visualization (scales, shapes)
- **ActionCable**: WebSocket client for Rails
- **Tailwind CSS**: Utility-first styling
- **Svelte DnD**: Drag-and-drop functionality
- **Emoji Picker**: Emoji selection UI

---

## 7. Key Files Summary

| File | Lines | Purpose |
|------|-------|---------|
| `src/hooks.server.ts` | 115 | Auth middleware, locale detection, route guards |
| `src/lib/api/client.ts` | 42 | GraphQL fetch wrapper |
| `src/lib/api/auth.ts` | 87 | JWT/cookie utilities |
| `src/lib/api/types.ts` | 466 | TypeScript interfaces (all data types) |
| `src/lib/stores/notifications.svelte.ts` | 289 | Real-time notifications via ActionCable |
| `src/lib/components/layout/Navbar.svelte` | 180 | Top navigation, notifications, language switcher |
| `src/lib/components/charts/RadarChart.svelte` | 53 | Skill radar visualization |
| `src/lib/components/charts/ProgressChart.svelte` | 121 | Weekly progress line chart |
| `src/routes/+layout.server.ts` | 7 | Root layout load |
| `src/routes/teacher/+layout.server.ts` | 14 | Teacher role guard |
| `src/routes/teacher/dashboard/+page.server.ts` | 26 | Load classrooms |
| `src/routes/teacher/students/[id]/+page.server.ts` | 30 | Load student radar + progress |
| `src/routes/login/+page.server.ts` | 50 | Login form action |
| `vite.config.ts` | 15 | Vite + Tailwind + Paraglide plugins |
| `svelte.config.js` | 10 | SvelteKit + Vercel adapter |
| `package.json` | 41 | Dependencies |

---

## 8. Directories Requiring Codemap.md

Each of these directories should have its own `codemap.md` documenting internal structure:

### Core Directories
1. **`src/lib/api/`** — GraphQL client, auth, types, queries
2. **`src/lib/stores/`** — Reactive state management
3. **`src/lib/components/`** — Reusable UI components
4. **`src/lib/utils/`** — Utility functions
5. **`src/lib/paraglide/`** — i18n setup and messages

### Route Directories (by role)
6. **`src/routes/teacher/`** — Teacher dashboard and features
7. **`src/routes/parent/`** — Parent dashboard and features
8. **`src/routes/school/`** — School manager dashboard
9. **`src/routes/admin/`** — Admin features
10. **`src/routes/api/`** — Server-side API endpoints

### Feature Directories
11. **`src/lib/components/charts/`** — Data visualization components
12. **`src/lib/components/layout/`** — Layout components (AppShell, Navbar, Sidebar)
13. **`src/lib/components/ui/`** — Basic UI components
14. **`src/lib/components/feed/`** — Feed-related components

---

## 9. Development Workflow

### Local Setup
```bash
cd front-end
npm install
npm run dev  # Vite dev server on http://localhost:5173
```

### Build & Deploy
```bash
npm run build  # SvelteKit + Vite build
npm run preview  # Preview production build
# Vercel auto-deploys on git push
```

### Type Checking
```bash
npm run check  # svelte-kit sync + svelte-check
npm run check:watch  # Watch mode
```

### Environment Variables
```
RAILS_GRAPHQL_URL=http://localhost:3000/graphql
RAILS_CABLE_URL=ws://localhost:3004/cable
```

---

## 10. Common Patterns & Best Practices

### ✅ Do
- Use server-side load functions for data fetching
- Centralize GraphQL queries in `/lib/api/queries/`
- Use Paraglide message functions for all UI text
- Leverage Svelte 5 reactivity (`$state`, `$derived`)
- Guard routes in `hooks.server.ts`
- Use TypeScript for type safety
- Organize components by feature/responsibility

### ❌ Don't
- Fetch data in components (use load functions)
- Hardcode strings (use Paraglide messages)
- Store sensitive data in localStorage (use httpOnly cookies)
- Bypass role guards (enforce in hooks.server.ts)
- Mix concerns (keep components, stores, queries separate)

---

## 11. Testing & Debugging

### Browser DevTools
- **Network**: Monitor GraphQL requests
- **Application**: Inspect cookies (access, refresh, role)
- **Console**: Check for errors, log notifications

### Common Issues
1. **"Authentication failed"** → Token expired, refresh failed
   - Check: `getAccessToken()`, `isTokenExpired()`, refresh endpoint
2. **"Unauthorized"** → Role mismatch
   - Check: `user.type` in hooks.server.ts, route guards
3. **Notifications not appearing** → WebSocket connection failed
   - Check: `RAILS_CABLE_URL`, ActionCable subscription
4. **Messages not translating** → Paraglide not initialized
   - Check: `paraglideMiddleware()` in hooks.server.ts, message files

---

## 12. Future Improvements

- [ ] Add unit tests (Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Implement offline support (Service Worker)
- [ ] Add error boundary components
- [ ] Optimize bundle size (code splitting)
- [ ] Add analytics tracking
- [ ] Implement dark mode toggle
- [ ] Add accessibility improvements (ARIA labels, keyboard nav)

---

**Last Updated**: March 15, 2026  
**Maintainer**: GrewMe Team  
**Related**: Rails backend at `/Users/theresiaputri/repo/grewme/backend`
