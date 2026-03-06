# Design: Curriculum & Exam Frontend (SvelteKit)

## Overview

Build the curriculum management and exam workflow UI for all three roles (teacher, parent, school manager) in the SvelteKit frontend. The backend GraphQL API is fully implemented with 7 query resolvers and 13 mutations.

## Architecture Decision

**Approach: Hierarchical Drill-Down** — Each entity gets its own route page, matching the existing app pattern (e.g., `/teacher/classrooms/[id]`). SvelteKit file-based routing, server-side data loading via `+page.server.ts`, Tailwind CSS v4 styling.

## Routes

### Teacher (`/teacher/curriculum/`)
| Route | Purpose |
|-------|---------|
| `/teacher/curriculum` | Subjects list (cards grid) + create button |
| `/teacher/curriculum/[subjectId]` | Subject detail: topics list + CRUD |
| `/teacher/curriculum/[subjectId]/[topicId]` | Topic detail: learning objectives + linked exams |
| `/teacher/exams` | All exams list (filterable by subject/topic/type) |
| `/teacher/exams/new` | Create exam form |
| `/teacher/exams/[examId]` | Exam detail: questions, assigned classrooms, submissions |
| `/teacher/exams/[examId]/grade/[submissionId]` | Grade a submission |

### Parent (`/parent/curriculum/`)
| Route | Purpose |
|-------|---------|
| `/parent/curriculum` | Browse subjects (read-only) |
| `/parent/children/[id]/exams` | Child's exam results + mastery overview |

### School Manager (`/school/curriculum/`)
| Route | Purpose |
|-------|---------|
| `/school/curriculum` | Subjects list + CRUD (school-wide) |
| `/school/curriculum/[subjectId]` | Subject detail (same as teacher) |
| `/school/curriculum/[subjectId]/[topicId]` | Topic detail (same as teacher) |
| `/school/exams` | All exams across school |

## Navigation Changes

Add "Curriculum" nav item to each role's sidebar:

- **Teacher:** `{ label: 'Curriculum', href: '/teacher/curriculum', icon: '📚' }` — between Calendar and Profile
- **Parent:** `{ label: 'Curriculum', href: '/parent/curriculum', icon: '📚' }` — between Calendar and Profile
- **School Manager:** `{ label: 'Curriculum', href: '/school/curriculum', icon: '📚' }` — between Feed and Calendar

Add "Exams" nav item for teacher and school manager:
- **Teacher:** `{ label: 'Exams', href: '/teacher/exams', icon: '📝' }` — after Curriculum
- **School Manager:** `{ label: 'Exams', href: '/school/exams', icon: '📝' }` — after Curriculum

## Data Flow

All pages use the existing pattern:
1. `+page.server.ts` calls `graphql()` with the user's access token
2. Returns typed data to `+page.svelte`
3. Page renders with Tailwind + existing UI components (Card, Button, Input, Badge, Alert, Skeleton)

## New Files Needed

### GraphQL Queries (`src/lib/api/queries/curriculum.ts`)
- `SUBJECTS_QUERY` — list subjects by school_id
- `SUBJECT_QUERY` — single subject with topics
- `TOPIC_QUERY` — single topic with LOs and exams
- `EXAM_QUERY` — single exam with questions/criteria
- `CLASSROOM_EXAMS_QUERY` — exams for a classroom
- `EXAM_SUBMISSION_QUERY` — single submission with answers
- `STUDENT_MASTERIES_QUERY` — mastery status for a student

### GraphQL Mutations (`src/lib/api/queries/curriculum.ts`)
- `CREATE_SUBJECT`, `UPDATE_SUBJECT`, `DELETE_SUBJECT`
- `CREATE_TOPIC`, `UPDATE_TOPIC`, `DELETE_TOPIC`
- `CREATE_LEARNING_OBJECTIVE`, `UPDATE_LEARNING_OBJECTIVE`, `DELETE_LEARNING_OBJECTIVE`
- `CREATE_EXAM`, `ASSIGN_EXAM_TO_CLASSROOM`
- `SUBMIT_EXAM_ANSWERS`, `GRADE_EXAM_SUBMISSION`

### TypeScript Types (`src/lib/api/types.ts` — extend)
- `Subject`, `Topic`, `LearningObjective`
- `Exam`, `ExamQuestion`, `RubricCriteria`
- `ClassroomExam`, `ExamSubmission`, `ExamAnswer`, `RubricScore`
- `ObjectiveMastery`
- Enum types: `ExamType`, `ClassroomExamStatus`, `ExamSubmissionStatus`

### New UI Components
- `SubjectCard.svelte` — subject card with topic count
- `TopicCard.svelte` — topic card with LO count + exam count
- `ExamCard.svelte` — exam card with type badge, duration, max score
- `MasteryBadge.svelte` — mastery status indicator (mastered/in-progress/not-started)
- `ExamTypeSelect.svelte` — dropdown for exam type selection
- Modal/dialog for create/edit forms (inline or slide-over)

## Frontend Bug Fixes (included)

Fix the LSP errors in teacher/parent layouts:
- The `setInitialNotifications` import error is a Svelte 5 runes `.svelte.ts` module resolution issue
- The `cableUrl` error is because `PageData` type doesn't include it — need to use layout data typing properly

## Exam Type UX

| Exam Type | Create Form | Grading UI |
|-----------|-------------|------------|
| `score_based` | Max score field | Score input (0–max) |
| `multiple_choice` | Questions with options + correct answer | Auto-graded on submit |
| `rubric_based` | Rubric criteria with max points | Score per criterion |
| `pass_fail` | No extra fields | Pass/Fail toggle |

## School ID Resolution

The `subjects` query requires `school_id`. Resolution per role:
- **Teacher:** Get school_id from the teacher's first classroom (`classrooms[0].school.id`)
- **School Manager:** Get from `me` query (school_manager has `school.id`)
- **Parent:** Get from children's classrooms

This will be loaded in the layout server and passed down.
