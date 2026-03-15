# `/src/routes/teacher` — Teacher Dashboard & Features

**Responsibility**: Teacher-specific routes, dashboards, classroom management, student tracking, exam creation/grading, curriculum management, and attendance.

**Design Pattern**: Role-based access control with server-side data loading.

**Role Guard**: `+layout.server.ts` enforces `user.type === 'Teacher'`

---

## Directory Structure

```
src/routes/teacher/
├── +layout.server.ts              — Role guard, load accessToken + cableUrl
├── dashboard/
│   ├── +page.server.ts            — Load classrooms
│   └── +page.svelte               — Display classroom cards
├── classrooms/
│   └── [id]/
│       ├── +page.server.ts        — Load classroom detail + students
│       └── +page.svelte           — Classroom overview
├── students/
│   └── [id]/
│       ├── +page.server.ts        — Load radar, progress, daily scores
│       ├── +page.svelte           — Student profile with charts
│       └── health/
│           ├── +page.server.ts    — Load health checkups
│           └── +page.svelte       — Health records
├── curriculum/
│   ├── +page.server.ts            — Load subjects
│   ├── +page.svelte               — Subject list
│   ├── [subjectId]/
│   │   ├── +page.server.ts        — Load subject detail
│   │   ├── +page.svelte           — Subject with topics
│   │   └── [topicId]/
│   │       ├── +page.server.ts    — Load topic detail
│   │       └── +page.svelte       — Topic with learning objectives
│   └── yearly/
│       ├── +page.server.ts        — Load grade curriculum
│       └── +page.svelte           — Yearly curriculum view
├── exams/
│   ├── +page.server.ts            — Load exams
│   ├── +page.svelte               — Exam list
│   ├── new/
│   │   ├── +page.server.ts        — Load question templates
│   │   ├── +page.svelte           — Exam creation form
│   │   └── +page.server.ts        — Handle exam creation
│   ├── [examId]/
│   │   ├── +page.server.ts        — Load exam detail + classrooms
│   │   ├── +page.svelte           — Exam detail with assign form
│   │   ├── +page.server.ts        — Handle exam assignment
│   │   └── grade/
│   │       ├── +page.server.ts    — Load submissions
│   │       ├── +page.svelte       — Grading list
│   │       └── [submissionId]/
│   │           ├── +page.server.ts — Load submission detail
│   │           ├── +page.svelte    — Grading interface
│   │           └── +page.server.ts — Handle grading
├── attendance/
│   ├── +page.server.ts            — Load attendance records
│   └── +page.svelte               — Attendance tracking
├── calendar/
│   ├── +page.server.ts            — Load classroom events
│   ├── +page.svelte               — Calendar view
│   └── +page.server.ts            — Handle event creation
├── feed/
│   ├── +page.server.ts            — Load feed posts
│   ├── +page.svelte               — Feed view
│   └── +page.server.ts            — Handle post creation
├── messages/
│   ├── +page.server.ts            — Load messages
│   └── +page.svelte               — Messaging interface
├── leave-requests/
│   ├── +page.server.ts            — Load student leave requests
│   └── +page.svelte               — Manage requests (approve/reject)
├── my-leave/
│   ├── +page.server.ts            — Load teacher's leave requests
│   └── +page.svelte               — View own leave requests
├── profile/
│   ├── +page.server.ts            — Load teacher profile
│   ├── +page.svelte               — Profile form
│   └── +page.server.ts            — Handle profile update
├── teacher-leave/
│   ├── +page.server.ts            — Load teacher leave requests (admin)
│   └── +page.svelte               — Manage teacher leave
├── settings/
│   ├── +page.server.ts            — Load school settings
│   ├── +page.svelte               — Settings form
│   └── academic-years/
│       ├── +page.server.ts        — Load academic years
│       ├── +page.svelte           — Academic years list
│       └── +page.server.ts        — Handle year creation/update
└── onboarding/
    ├── +page.server.ts            — Load onboarding status
    └── +page.svelte               — Onboarding wizard
```

---

## Key Files

### `+layout.server.ts` — Role Guard & Auth Setup

**Purpose**: Enforce Teacher role, provide accessToken and WebSocket URL to all child routes.

**Code**:
```typescript
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.type !== 'Teacher') {
    throw redirect(303, '/login');
  }
  return {
    user: locals.user,
    accessToken: locals.accessToken,
    cableUrl: env.RAILS_CABLE_URL || 'ws://localhost:3004/cable',
  };
};
```

**Data Flow**:
1. User navigates to `/teacher/*`
2. `hooks.server.ts` populates `locals.user` and `locals.accessToken`
3. This layout checks: `user.type === 'Teacher'`
4. If not Teacher: redirect to `/login`
5. If Teacher: return user, accessToken, cableUrl to all child routes
6. Child routes can access via `data.user`, `data.accessToken`, `data.cableUrl`

**Usage in Child Routes**:
```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ locals }) => {
  // locals.accessToken is available here
  const data = await graphql(QUERY, {}, locals.accessToken!);
  return { data };
};

// +page.svelte
<script>
  import { connectNotifications } from '$lib/stores/notifications.svelte';
  
  let { data } = $props();
  
  onMount(() => {
    connectNotifications(data.accessToken, data.cableUrl);
  });
</script>
```

---

### Dashboard (`dashboard/+page.server.ts`)

**Purpose**: Load teacher's classrooms.

**Query**: `CLASSROOMS_QUERY`

**Returns**:
```typescript
{
  classrooms: Classroom[]
}
```

**Component** (`+page.svelte`):
- Displays classroom cards in grid
- Each card links to `/teacher/classrooms/[id]`
- Shows classroom name and school name
- Empty state if no classrooms

---

### Student Profile (`students/[id]/+page.server.ts`)

**Purpose**: Load student's skill radar, progress, and daily scores.

**Queries** (parallel):
1. `STUDENT_RADAR_QUERY` → Current skills
2. `STUDENT_PROGRESS_QUERY` → Weekly progress
3. `STUDENT_DAILY_SCORES_QUERY` → Daily scores (paginated)

**Returns**:
```typescript
{
  radar: RadarData,
  progress: ProgressData,
  scores: DailyScore[]
}
```

**Component** (`+page.svelte`):
- RadarChart (current skills)
- ProgressChart (weekly trend)
- Daily scores table
- Health records link

---

### Exam Management (`exams/[examId]/+page.server.ts`)

**Purpose**: Load exam detail and classrooms for assignment.

**Queries** (parallel):
1. `EXAM_QUERY` → Exam detail with questions
2. `CLASSROOMS_QUERY` → Available classrooms

**Returns**:
```typescript
{
  exam: Exam,
  classrooms: Classroom[]
}
```

**Form Action** (`assign`):
- Accepts: examId, classroomId, scheduledAt, dueAt, durationMinutes, showResults
- Calls: `ASSIGN_EXAM_MUTATION`
- Returns: success or error

**Component** (`+page.svelte`):
- Exam detail (title, description, questions)
- Assign form (select classroom, set dates/duration)
- List of classrooms already assigned

---

### Grading (`exams/[examId]/grade/[submissionId]/+page.server.ts`)

**Purpose**: Load submission detail for grading.

**Query**: `EXAM_SUBMISSION_QUERY`

**Returns**:
```typescript
{
  submission: ExamSubmission
}
```

**Form Action** (`grade`):
- Accepts: submissionId, answers (for rubric), feedback
- Calls: `GRADE_SUBMISSION_MUTATION`
- Returns: success or error

**Component** (`+page.svelte`):
- Display student's answers
- Grading interface (score, feedback)
- Submit grading form

---

### Curriculum (`curriculum/[subjectId]/[topicId]/+page.server.ts`)

**Purpose**: Load topic detail with learning objectives.

**Query**: `TOPIC_QUERY`

**Returns**:
```typescript
{
  topic: Topic
}
```

**Component** (`+page.svelte`):
- Topic name and description
- Learning objectives list
- Exams for this topic
- Edit/delete options

---

### Attendance (`attendance/+page.server.ts`)

**Purpose**: Load attendance records.

**Query**: `ATTENDANCE_RECORDS_QUERY`

**Returns**:
```typescript
{
  records: AttendanceRecord[]
}
```

**Form Action** (`mark`):
- Accepts: studentId, date, status (present/absent/late)
- Calls: `MARK_ATTENDANCE_MUTATION`
- Returns: success or error

**Component** (`+page.svelte`):
- Classroom selector
- Date picker
- Student list with attendance checkboxes
- Submit button

---

### Calendar (`calendar/+page.server.ts`)

**Purpose**: Load classroom events.

**Query**: `CLASSROOM_EVENTS_QUERY`

**Returns**:
```typescript
{
  events: ClassroomEvent[]
}
```

**Form Action** (`create`):
- Accepts: classroomId, title, description, eventDate, startTime, endTime
- Calls: `CREATE_EVENT_MUTATION`
- Returns: success or error

**Component** (`+page.svelte`):
- Calendar view (month/week)
- Event list
- Create event form

---

### Feed (`feed/+page.server.ts`)

**Purpose**: Load feed posts.

**Query**: `FEED_POSTS_QUERY`

**Returns**:
```typescript
{
  posts: FeedPost[]
}
```

**Form Action** (`create`):
- Accepts: classroomId, body, mediaFiles, taggedStudentIds
- Calls: `CREATE_POST_MUTATION`
- Returns: success or error

**Component** (`+page.svelte`):
- Create post form (text, file upload, student tagging)
- Feed posts list (FeedCard components)
- Like/comment functionality

---

### Leave Requests (`leave-requests/+page.server.ts`)

**Purpose**: Load student leave requests for approval.

**Query**: `LEAVE_REQUESTS_QUERY`

**Returns**:
```typescript
{
  requests: LeaveRequest[]
}
```

**Form Actions**:
- `approve`: Approve leave request
- `reject`: Reject leave request

**Component** (`+page.svelte`):
- List of pending leave requests
- Approve/reject buttons
- Request details (student, dates, reason)

---

### Profile (`profile/+page.server.ts`)

**Purpose**: Load teacher profile.

**Query**: `TEACHER_PROFILE_QUERY`

**Returns**:
```typescript
{
  user: Teacher
}
```

**Form Action** (`update`):
- Accepts: name, email, phone, bio, birthdate, gender, qualification, address, avatar
- Calls: `UPDATE_PROFILE_MUTATION`
- Returns: success or error

**Component** (`+page.svelte`):
- Profile form with all fields
- Avatar upload
- Change password form

---

## Data Flow Patterns

### Pattern 1: List + Detail
```
Dashboard (/teacher/dashboard)
  ↓ Load classrooms
  ↓ Display classroom cards
  ↓ Click classroom
  ↓ Navigate to /teacher/classrooms/[id]
  ↓ Load classroom detail + students
  ↓ Display classroom overview
```

### Pattern 2: Nested Detail
```
Student Profile (/teacher/students/[id])
  ↓ Load radar, progress, scores (parallel)
  ↓ Display charts
  ↓ Click "Health" link
  ↓ Navigate to /teacher/students/[id]/health
  ↓ Load health checkups
  ↓ Display health records
```

### Pattern 3: Create + Assign
```
Exam Detail (/teacher/exams/[examId])
  ↓ Load exam + classrooms
  ↓ Display exam detail
  ↓ Fill assign form (select classroom, set dates)
  ↓ Submit form action
  ↓ Call ASSIGN_EXAM_MUTATION
  ↓ Show success/error
  ↓ Reload page or redirect
```

### Pattern 4: Grading Workflow
```
Exam Submissions (/teacher/exams/[examId]/grade)
  ↓ Load submissions list
  ↓ Display submissions table
  ↓ Click submission
  ↓ Navigate to /teacher/exams/[examId]/grade/[submissionId]
  ↓ Load submission detail
  ↓ Display student answers + grading form
  ↓ Fill grading form (score, feedback)
  ↓ Submit form action
  ↓ Call GRADE_SUBMISSION_MUTATION
  ↓ Show success/error
```

---

## Integration Points

### With Parent Routes
- Teacher can view student's parent-visible data
- Parent can see teacher's feedback on student

### With School Routes
- School manager can view teacher's classrooms
- School manager can manage teacher's leave requests

### With Notifications
- Teacher receives notifications for:
  - Student exam submissions
  - Leave requests from parents
  - Classroom events
  - Feed post comments

### With Real-time Updates
- Notifications connected in layout
- Feed posts updated in real-time
- Attendance marked in real-time

---

## Best Practices

### ✅ Do
- Use `locals.accessToken!` in all load functions
- Load data in parallel with `Promise.all()`
- Handle GraphQL errors with try/catch
- Redirect on authentication failure
- Use form actions for mutations
- Validate input server-side

### ❌ Don't
- Fetch data in components
- Hardcode GraphQL queries
- Ignore role guards
- Store sensitive data in components
- Use client-side mutations without server validation

---

## Testing

### Unit Tests
```typescript
describe('teacher dashboard', () => {
  it('should load classrooms', async () => {
    const data = await load({ locals: { accessToken: 'token' } });
    expect(data.classrooms).toHaveLength(2);
  });

  it('should redirect if not teacher', async () => {
    const err = await expect(
      load({ locals: { user: { type: 'Parent' } } })
    ).rejects.toThrow(redirect);
  });
});
```

### Integration Tests
```typescript
describe('exam assignment', () => {
  it('should assign exam to classroom', async () => {
    const result = await actions.assign({
      request: new Request('...', { method: 'POST', body: formData }),
      locals: { accessToken: 'token' }
    });
    expect(result.assignSuccess).toBe(true);
  });
});
```

---

**Last Updated**: March 15, 2026
