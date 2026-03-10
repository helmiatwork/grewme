# Design: Kahoot-style Exam Access

**Date:** 2026-03-10
**Status:** Approved
**Related:** Parameterized Questions feature (in progress)

## Problem

Students have no way to access or take exams in GrewMe. The backend supports exam submissions, but there's no student authentication and no exam-taking UI. Building a full student auth system is overkill for young kids.

## Solution

Google Forms / Kahoot-style exam access: teacher shares a 6-character code, students open `/exam/[code]`, pick their name from the class list, and take the exam. No login required.

## Flow

```
Teacher creates exam → assigns to classroom → gets a 6-char code (e.g. "FRK42M")
     ↓
Teacher shares the code (writes on board, sends via WhatsApp, etc.)
     ↓
Student opens /exam/FRK42M → sees class name + picks their name from list
     ↓
Student confirmed → timer starts → answers questions → auto-submit on timeout
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Access method | Classroom-level code + name pick | Simplest for young kids. One code per class. Teacher is present. |
| Code format | 6 alphanumeric, uppercase, no ambiguous chars (0/O, 1/I/L) | Easy to read aloud, write on whiteboard |
| Auth | None required | Code + name selection = session. No passwords for kids. |
| Session | Server-side, cookie/token for rejoin | Student can close browser and return. Same session if cookie present, or re-pick name. |
| Timer | Server-side countdown, starts on first question load | Prevents client-side cheating. Auto-submit via background job. |
| Page | Standalone `/exam/[code]` — no navbar, minimal UI, mobile-first | Students never see the teacher app. Clean, distraction-free. |
| Results | After submit: show score (MC) or "submitted" (rubric) | Teacher can toggle `show_results` per exam. |

## Alternatives Considered

### A. Classroom-level code (Chosen)
- One code per ClassroomExam, auto-generated on assignment
- Student enters code, picks name from class list
- Pro: Simplest, one code for whole class
- Con: Student could pick someone else's name (acceptable in supervised setting)

### B. Student-level tokens
- Each student gets a unique token/link
- Pro: More secure
- Con: Teacher must distribute 30 different links — impractical

### C. Code + PIN
- Classroom code + personal student PIN
- Pro: More secure than name-picking
- Con: Two things to remember — too much for young kids

## Data Model Changes

### ClassroomExam (modify existing)

```ruby
# New columns
access_code: string       # unique, 6-char, indexed. Auto-generated on create.
duration_minutes: integer  # nullable — null means no timer
show_results: boolean      # default: false — show score after submit?
```

### ExamSubmission (modify existing)

```ruby
# New columns
started_at: datetime       # when student loaded first question
submitted_at: datetime     # when answers were submitted
auto_submitted: boolean    # default: false — true if timer expired
session_token: string      # for rejoin without auth, unique, indexed
```

## Access Code Generation

- Characters: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no 0/O, 1/I/L)
- Length: 6
- Generated automatically when ClassroomExam is created
- Unique constraint in DB + retry on collision
- Example: `FRK42M`, `HT7BNP`

## Student Exam-Taking Flow (Detail)

### 1. Enter Code
- URL: `/exam` — input field for code
- Or direct URL: `/exam/FRK42M`
- Validates code exists + exam is active (not past due, status = active)

### 2. Pick Name
- Shows classroom name + list of students
- Student taps their name
- If student already has a submission in progress → rejoin that session
- If student already submitted → show "already submitted" message

### 3. Confirm & Start
- Shows: exam name, number of questions, time limit
- "Ready? Start Exam" button
- On confirm: creates ExamSubmission (started_at = now), sets session cookie

### 4. Take Exam
- Questions displayed (all at once or paginated — TBD per exam setting)
- Timer visible in top bar (countdown from duration_minutes)
- Answers auto-saved periodically (every 30s) to prevent data loss
- For parameterized questions: shows `generated_text` from StudentQuestion

### 5. Submit
- Manual "Submit" button, or auto-submit when timer expires
- Auto-submit: background job checks `started_at + duration_minutes`
- After submit: show score (if MC + show_results) or "Your exam has been submitted"

### 6. Rejoin (browser closed)
- If session cookie present → resume where left off
- If no cookie → re-enter code, pick name → if submission exists with status "in_progress", rejoin
- Timer keeps running server-side regardless

## Frontend Architecture

- Route: `/exam/[code]` — standalone layout, no auth guard
- No navbar, no sidebar — clean minimal page
- Mobile-first responsive design
- Components:
  - `CodeEntry` — input for exam code
  - `StudentPicker` — grid of student names to tap
  - `ExamConfirm` — pre-exam info + start button
  - `ExamTaker` — questions + timer + submit
  - `ExamResult` — post-submit score/message

## Backend Changes

### New GraphQL Queries
- `examByAccessCode(code: String!)` — returns exam info + student list (no auth required)
- `examSession(sessionToken: String!)` — returns current submission state for rejoin

### New GraphQL Mutations
- `startExam(accessCode: String!, studentId: ID!)` — creates submission, returns session token
- `saveExamProgress(sessionToken: String!, answers: [AnswerInput!]!)` — auto-save answers
- `submitExam(sessionToken: String!)` — final submit

### Background Job
- `ExamAutoSubmitJob` — scheduled at `started_at + duration_minutes`, submits if not already submitted

### Security
- No authenticated user required for exam routes
- Session token is the auth mechanism (UUID, not guessable)
- Rate limiting on code entry (prevent brute force)
- Access code only works while exam is active
