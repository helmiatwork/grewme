# `/src/lib/api` — GraphQL Client & API Layer

**Responsibility**: Centralized GraphQL communication, authentication, type definitions, and query organization.

**Design Pattern**: Separation of concerns
- `client.ts` — Low-level GraphQL fetch
- `auth.ts` — JWT/cookie management
- `types.ts` — TypeScript interfaces (single source of truth)
- `queries/` — Organized GraphQL queries/mutations by feature
- `upload.ts` — File upload utilities

---

## Directory Structure

```
src/lib/api/
├── client.ts          (42 lines) — GraphQL fetch wrapper
├── auth.ts            (87 lines) — JWT/cookie utilities
├── types.ts           (466 lines) — TypeScript interfaces
├── upload.ts          — File upload utilities
└── queries/           — GraphQL queries organized by feature
    ├── auth.ts        — LOGIN, REFRESH, LOGOUT mutations
    ├── classrooms.ts  — Classroom queries
    ├── students.ts    — Student queries (radar, progress, scores)
    ├── curriculum.ts  — Subject, topic, exam queries
    ├── exam.ts        — Exam submission queries
    ├── feed.ts        — Feed post queries
    ├── calendar.ts    — Event queries
    ├── attendance.ts  — Attendance queries
    ├── profile.ts     — Profile update mutations
    ├── permissions.ts — Permission queries
    ├── parents.ts     — Parent-specific queries
    ├── health-checkups.ts — Health data queries
    ├── data-rights.ts — Data privacy queries
    ├── onboarding.ts  — Onboarding status
    ├── invitations.ts — Invitation mutations
    ├── consent.ts     — Consent mutations
    └── school.ts      — School queries
```

---

## Core Files

### `client.ts` — GraphQL Fetch Wrapper

**Purpose**: Low-level GraphQL communication with error handling.

**Key Exports**:
- `graphql<T>(query, variables?, token?)` — Execute GraphQL query/mutation
  - Returns: `Promise<T>` (typed response)
  - Throws: `GraphQLError` on errors
  - Auth: Optional Bearer token in Authorization header

- `GraphQLError` — Custom error class
  - Properties: `errors: Array<{ message, path? }>`
  - Useful for distinguishing GraphQL errors from network errors

**Configuration**:
- Endpoint: `RAILS_GRAPHQL_URL` env var (default: http://localhost:3000/graphql)
- Headers: `Content-Type: application/json`, optional `Authorization: Bearer {token}`

**Usage**:
```typescript
import { graphql, GraphQLError } from '$lib/api/client';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';

try {
  const data = await graphql<{ classrooms: Classroom[] }>(
    CLASSROOMS_QUERY,
    {},
    accessToken
  );
  console.log(data.classrooms);
} catch (err) {
  if (err instanceof GraphQLError) {
    console.error('GraphQL error:', err.errors);
  } else {
    console.error('Network error:', err);
  }
}
```

---

### `auth.ts` — JWT & Cookie Management

**Purpose**: Handle JWT tokens, cookie storage, and token validation.

**Key Exports**:

#### Cookie Management
- `setAuthCookies(cookies, accessToken, refreshToken, expiresIn, role)`
  - Stores tokens in httpOnly cookies
  - Access token: maxAge = expiresIn (10 min)
  - Refresh token: maxAge = 30 days
  - Role: httpOnly = false (client needs to read for redirects)

- `clearAuthCookies(cookies)`
  - Deletes all auth cookies (logout)

- `getAccessToken(cookies)` → `string | undefined`
- `getRefreshToken(cookies)` → `string | undefined`
- `getRole(cookies)` → `string | undefined`

#### JWT Utilities
- `decodeJwtPayload(token)` → `SessionUser | null`
  - Decodes JWT without verification (Rails verifies)
  - Extracts: id, type (Teacher/Parent/SchoolManager), name, email
  - Used in hooks.server.ts to populate locals.user

- `isTokenExpired(token)` → `boolean`
  - Checks if token exp < now + 30s buffer
  - 30s buffer accounts for clock skew

**Cookie Configuration**:
```typescript
const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: false,  // Set to true in production
  sameSite: 'lax'
};
```

**Usage**:
```typescript
// In login form action
import { setAuthCookies } from '$lib/api/auth';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await graphql<{ login: AuthPayload }>(LOGIN_MUTATION, ...);
    const { accessToken, refreshToken, expiresIn, user } = data.login;
    
    setAuthCookies(cookies, accessToken, refreshToken, expiresIn, user.type);
    throw redirect(303, '/teacher/dashboard');
  }
};

// In hooks.server.ts
import { getAccessToken, isTokenExpired, decodeJwtPayload } from '$lib/api/auth';

const token = getAccessToken(cookies);
if (token && !isTokenExpired(token)) {
  const user = decodeJwtPayload(token);
  event.locals.user = user;
}
```

---

### `types.ts` — TypeScript Interfaces (466 lines)

**Purpose**: Single source of truth for all data types. Ensures type safety across the app.

**Organization**:

#### User Types
- `Teacher` — Teacher profile (name, email, phone, bio, avatar, etc.)
- `Parent` — Parent profile
- `SchoolManager` — School manager profile (includes school reference)
- `User` — Union type: `Teacher | Parent | SchoolManager`
- `SessionUser` — Decoded from JWT (id, type, name, email)

#### Authentication
- `AuthPayload` — Login response (accessToken, refreshToken, expiresIn, user, errors)
- `LogoutPayload` — Logout response (success, errors)

#### Classroom & Students
- `Classroom` — Classroom data (id, name, school, students, studentCount)
- `Student` — Student data (id, name, classrooms)

#### Skill Radar
- `SkillCategory` — Union: 'READING' | 'MATH' | 'WRITING' | 'LOGIC' | 'SOCIAL'
- `RadarSkills` — Object with skill scores (reading, math, writing, logic, social)
- `RadarData` — Student radar (studentId, studentName, skills)
- `DailyScore` — Single daily score entry (id, date, skillCategory, score, student, teacher)

#### Progress Tracking
- `ProgressWeek` — Weekly progress (period, skills)
- `ProgressData` — Array of weeks

#### Classroom Overview
- `ClassroomOverviewStudent` — Student in classroom overview (studentId, studentName, skills)
- `ClassroomOverview` — Classroom with all students' skills

#### Curriculum
- `Subject` — Subject (id, name, description, topics)
- `Topic` — Topic (id, name, description, position, subject, learningObjectives, exams)
- `LearningObjective` — Learning objective (id, name, description, position, thresholds)

#### Exams
- `ExamType` — Union: 'SCORE_BASED' | 'MULTIPLE_CHOICE' | 'RUBRIC' | 'PASS_FAIL'
- `ClassroomExamStatus` — Union: 'DRAFT' | 'ACTIVE' | 'CLOSED'
- `ExamSubmissionStatus` — Union: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED'
- `ExamQuestion` — Question with options, points, parameterized variables
- `Exam` — Exam (id, title, examType, maxScore, durationMinutes, questions, rubricCriteria)
- `ClassroomExam` — Exam assigned to classroom (id, exam, classroom, status, submissions)
- `ExamSubmission` — Student's exam submission (id, student, status, score, answers, rubricScores)
- `ExamAnswer` — Single answer (id, examQuestion, selectedAnswer, correct, pointsAwarded)
- `RubricScore` — Rubric evaluation (id, rubricCriteria, score, feedback)
- `ObjectiveMastery` — Learning objective mastery (id, student, objective, examMastered, dailyMastered)

#### Feed
- `FeedPost` — Feed post (id, body, teacher, classroom, mediaAttachments, taggedStudents, likes, comments)
- `FeedPostComment` — Comment on post (id, body, commenterName, commenterType, isMine, createdAt)
- `MediaAttachment` — File attachment (url, filename, contentType)

#### Calendar
- `ClassroomEvent` — Calendar event (id, title, description, eventDate, startTime, endTime, classroom, creator)

#### Permissions
- `Permission` — Permission override (id, resource, action, granted)
- `EffectivePermission` — Computed permission (resource, action, granted, source)
- `UserPermissions` — User's permissions (userId, role, overrides, effective)

#### Pagination (Relay-style)
- `PageInfo` — Pagination metadata (hasNextPage, hasPreviousPage, startCursor, endCursor)
- `Connection<T>` — Paginated response (nodes, pageInfo, totalCount)

#### Yearly Curriculum
- `AcademicYear` — Academic year (id, label, startDate, endDate, current)
- `GradeCurriculum` — Grade curriculum (id, grade, academicYear, items)
- `GradeCurriculumItem` — Curriculum item (id, subject, topic, position, displayName)

#### Exam Access (Kahoot-style)
- `ExamAccessInfo` — Public exam access (id, accessCode, durationMinutes, exam, classroom)
- `ExamSessionInfo` — Active exam session (id, status, startedAt, timeRemaining, sessionToken)

**Usage**:
```typescript
import type { Classroom, RadarData, ExamSubmission } from '$lib/api/types';

// In load function
const data = await graphql<{ classrooms: Classroom[] }>(CLASSROOMS_QUERY, {}, token);

// In component
let { data }: { data: Classroom } = $props();
```

---

### `upload.ts` — File Upload Utilities

**Purpose**: Handle file uploads (Firebase or backend endpoint).

**Typical Usage**:
```typescript
import { uploadFile } from '$lib/api/upload';

const file = new File([...], 'image.jpg', { type: 'image/jpeg' });
const url = await uploadFile(file);
```

---

## GraphQL Queries Directory

### Organization Strategy
Queries are organized by **feature/domain**, not by operation type (query vs mutation).

### Query Files

#### `auth.ts` — Authentication
- `LOGIN_MUTATION` — User login (email, password, role)
- `REFRESH_TOKEN_MUTATION` — Refresh access token
- `LOGOUT_MUTATION` — Logout (invalidate tokens)

#### `classrooms.ts` — Classroom Management
- `CLASSROOMS_QUERY` — List all classrooms for user
- `CLASSROOM_QUERY` — Single classroom detail
- `CLASSROOM_OVERVIEW_QUERY` — Classroom with all students' skills

#### `students.ts` — Student Data
- `STUDENT_RADAR_QUERY` — Student's current skill radar
- `STUDENT_PROGRESS_QUERY` — Student's weekly progress
- `STUDENT_DAILY_SCORES_QUERY` — Student's daily scores (paginated)

#### `curriculum.ts` — Curriculum Management
- `SUBJECTS_QUERY` — List subjects
- `SUBJECT_QUERY` — Subject detail with topics
- `TOPIC_QUERY` — Topic detail with learning objectives
- `EXAM_QUERY` — Exam detail with questions
- `ASSIGN_EXAM_MUTATION` — Assign exam to classroom

#### `exam.ts` — Exam Submissions
- `EXAM_SUBMISSIONS_QUERY` — List submissions for exam
- `SUBMIT_EXAM_MUTATION` — Submit exam answers
- `GRADE_SUBMISSION_MUTATION` — Grade submission (teacher)

#### `feed.ts` — Feed Posts
- `FEED_POSTS_QUERY` — List feed posts (paginated)
- `CREATE_POST_MUTATION` — Create new post
- `LIKE_POST_MUTATION` — Like/unlike post
- `COMMENT_MUTATION` — Add comment to post

#### `calendar.ts` — Calendar Events
- `CLASSROOM_EVENTS_QUERY` — List classroom events
- `CREATE_EVENT_MUTATION` — Create event

#### `attendance.ts` — Attendance Tracking
- `ATTENDANCE_RECORDS_QUERY` — List attendance records
- `MARK_ATTENDANCE_MUTATION` — Mark attendance

#### `profile.ts` — User Profile
- `UPDATE_PROFILE_MUTATION` — Update user profile
- `CHANGE_PASSWORD_MUTATION` — Change password

#### `permissions.ts` — Permissions
- `USER_PERMISSIONS_QUERY` — Get user's permissions
- `UPDATE_PERMISSIONS_MUTATION` — Update permissions

#### `parents.ts` — Parent-Specific
- `MY_CHILDREN_QUERY` — List parent's children

#### `health-checkups.ts` — Health Data
- `HEALTH_CHECKUPS_QUERY` — List health checkups

#### `data-rights.ts` — Data Privacy
- `DATA_RIGHTS_QUERY` — Get data rights status

#### `onboarding.ts` — Onboarding
- `ONBOARDING_STATUS_QUERY` — Get onboarding status

#### `invitations.ts` — Invitations
- `ACCEPT_INVITATION_MUTATION` — Accept invitation (email token)

#### `consent.ts` — Consent
- `ACCEPT_CONSENT_MUTATION` — Accept consent (email token)

#### `school.ts` — School Management
- `SCHOOL_QUERY` — School detail
- `UPDATE_SCHOOL_MUTATION` — Update school info

---

## Data Flow Examples

### Example 1: Load Classroom Overview
```typescript
// +page.server.ts
import { CLASSROOM_OVERVIEW_QUERY } from '$lib/api/queries/classrooms';
import { graphql } from '$lib/api/client';
import type { ClassroomOverview } from '$lib/api/types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const data = await graphql<{ classroomOverview: ClassroomOverview }>(
    CLASSROOM_OVERVIEW_QUERY,
    { classroomId: params.id },
    locals.accessToken!
  );
  return { overview: data.classroomOverview };
};

// +page.svelte
let { data } = $props();
// data.overview: ClassroomOverview
// data.overview.students: ClassroomOverviewStudent[]
// data.overview.students[0].skills: RadarSkills
```

### Example 2: Submit Exam
```typescript
// +page.server.ts
import { SUBMIT_EXAM_MUTATION } from '$lib/api/queries/exam';

export const actions: Actions = {
  submit: async ({ request, locals }) => {
    const formData = await request.formData();
    const answers = JSON.parse(formData.get('answers') as string);
    
    const data = await graphql<{ submitExam: { success: boolean; errors: string[] } }>(
      SUBMIT_EXAM_MUTATION,
      { input: { examSessionId, answers } },
      locals.accessToken!
    );
    
    if (data.submitExam.success) {
      return { success: true };
    } else {
      return fail(422, { error: data.submitExam.errors.join(', ') });
    }
  }
};
```

---

## Best Practices

### ✅ Do
- Centralize all GraphQL queries in `/queries/`
- Use TypeScript types from `types.ts`
- Handle `GraphQLError` separately from network errors
- Pass `locals.accessToken!` to graphql() in server-side code
- Organize queries by feature/domain
- Use Relay-style pagination (Connection<T>) for large datasets

### ❌ Don't
- Hardcode GraphQL queries in components
- Fetch data in components (use load functions)
- Mix query definitions with component logic
- Ignore GraphQL errors
- Store sensitive data in types (tokens, passwords)

---

## Testing

### Unit Tests
```typescript
import { graphql, GraphQLError } from '$lib/api/client';

describe('graphql client', () => {
  it('should throw GraphQLError on GraphQL errors', async () => {
    // Mock fetch to return GraphQL error
    const err = await expect(graphql(query)).rejects.toThrow(GraphQLError);
    expect(err.errors).toHaveLength(1);
  });
});
```

### Integration Tests
```typescript
describe('auth flow', () => {
  it('should login and set cookies', async () => {
    const data = await graphql<{ login: AuthPayload }>(LOGIN_MUTATION, ...);
    setAuthCookies(cookies, data.login.accessToken, ...);
    expect(getAccessToken(cookies)).toBe(data.login.accessToken);
  });
});
```

---

**Last Updated**: March 15, 2026
