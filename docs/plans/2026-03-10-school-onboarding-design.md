# School Onboarding System Design

**Date:** 2026-03-10
**Status:** Approved
**Branch:** `feature/school-onboarding`

## Problem

There is no way for a school manager to self-register or create a school through the app. Teachers and parents can only join via invitation/consent tokens, but the school itself must be created in the database manually. This blocks organic growth.

## Solution

A self-service registration flow for school managers that creates the school and manager together, followed by a step-by-step onboarding wizard to set up the school.

---

## 1. Registration Flow

### Current State
- Registration page supports Teacher (via invitation token) and Parent (via consent token) only
- No School Manager role option
- No school creation mutation

### New Flow
1. Add **School Manager** role to registration page
2. When selected, show school creation fields inline:
   - School name (required)
   - Min grade / Max grade (required)
   - Address: line 1, city, state, postal code, country (required)
3. Submit → `RegisterSchoolManager` mutation creates School + SchoolManager atomically
4. Returns auth tokens → redirect to `/school/onboarding`

### RegisterSchoolManager Mutation

```graphql
mutation RegisterSchoolManager(
  $name: String!
  $email: String!
  $password: String!
  $schoolName: String!
  $minGrade: Int!
  $maxGrade: Int!
  $addressLine1: String!
  $city: String!
  $stateProvince: String!
  $postalCode: String!
  $countryCode: String!
) {
  registerSchoolManager(...) {
    accessToken
    refreshToken
    user { id name email }
    school { id name }
    errors { message path }
  }
}
```

Backend creates both records in a transaction. If either fails, both roll back.

---

## 2. Onboarding Wizard

### Route
`/school/onboarding` — full-page wizard with its own layout (no sidebar nav).

### UI Structure
- **Left sidebar:** Progress indicator showing all 6 steps with checkmarks
- **Main area:** Current step form/content
- **Navigation:** Skip / Next buttons per step, "Finish Setup" always visible
- Can click any step in sidebar to navigate freely

### Steps

| # | Title | Required? | Description |
|---|-------|-----------|-------------|
| 1 | School Profile | Optional | Phone, email, website — polish school info |
| 2 | Academic Year | Nudge | Create current year (label, start/end dates) |
| 3 | Subjects | Optional | Create subjects (Math, Science, English, etc.) |
| 4 | Classrooms | Optional | Create classrooms with name and grade |
| 5 | Invite Teachers | Optional | Enter teacher emails → sends invitation links |
| 6 | Leave Settings | Optional | Configure max annual/sick leave days |

### Behavior
- All steps skippable (academic year has a "strongly recommended" nudge)
- "Finish Setup" → redirects to `/school/dashboard`
- State derived from existing data (no wizard state model needed)

---

## 3. Dashboard Onboarding Checklist

After the wizard, the school dashboard shows a checklist card until all steps are done or manually dismissed.

```
┌──────────────────────────────────────────┐
│ 🚀 Complete your school setup  (3/6)    │
│ ████████░░░░░░░░ 50%                    │
│                                          │
│ ✅ School profile                        │
│ ✅ Academic year                         │
│ ✅ Subjects                              │
│ ○  Classrooms → Set up                  │
│ ○  Invite teachers → Invite             │
│ ○  Leave settings → Configure           │
│                                          │
│ [Continue Setup]           [Dismiss]     │
└──────────────────────────────────────────┘
```

- "Continue Setup" → goes to `/school/onboarding` at the first incomplete step
- "Dismiss" → sets `onboarding_completed_at` on School, hides the card permanently

---

## 4. Technical Architecture

### Backend — New

| Item | Type | Details |
|------|------|---------|
| `RegisterSchoolManager` | Mutation | Creates School + SchoolManager in transaction |
| `UpdateSchoolProfile` | Mutation | Updates phone, email, website on School |
| `SchoolOnboardingStatus` | Query | Returns which steps are complete |
| `onboarding_completed_at` | Migration | Nullable datetime on `schools` — null = show checklist |
| `onboarding_step` | Migration | Integer on `schools`, default 0 — last visited wizard step |

### Onboarding Status (derived, not stored)

```ruby
{
  profile_complete: school.phone.present? || school.email.present?,
  academic_year_complete: school.academic_years.any?,
  subjects_complete: school.subjects.any?,
  classrooms_complete: school.classrooms.any?,
  teachers_invited: school.invitations.any?,
  leave_settings_configured: school.max_annual_leave_days != 12 || school.max_sick_leave_days != 14
}
```

### Backend — Reuse Existing

| Mutation | Used in step |
|----------|-------------|
| `CreateAcademicYear` | Step 2 |
| `CreateSubject` | Step 3 |
| `CreateClassroom` | Step 4 |
| `CreateInvitation` | Step 5 |
| `UpdateSchoolLeaveSettings` | Step 6 |

### Frontend — New

| Item | Path | Details |
|------|------|---------|
| Registration update | `/register` | Add School Manager role + school fields |
| Wizard layout | `(onboarding)/+layout.svelte` | Progress sidebar + content area |
| Wizard page | `/school/onboarding/+page.svelte` | Step router, 6 step components |
| Dashboard update | `/school/dashboard` | Onboarding checklist card |
| i18n keys | `messages/en.json`, `id.json` | ~60 new keys |

### Frontend — Step Components

Each step is a self-contained component that reuses existing mutation patterns:
- `OnboardingProfile.svelte` — school profile form
- `OnboardingAcademicYear.svelte` — create academic year
- `OnboardingSubjects.svelte` — add subjects (simple list + add form)
- `OnboardingClassrooms.svelte` — create classrooms
- `OnboardingInviteTeachers.svelte` — email input + send invitations
- `OnboardingLeaveSettings.svelte` — leave day limits form

---

## 5. Data Flow

```
Registration Page
  └─ POST /register (role=school_manager)
     └─ RegisterSchoolManager mutation
        ├─ Creates School record
        ├─ Creates SchoolManager record (linked to school)
        └─ Returns auth tokens
           └─ Redirect to /school/onboarding

Onboarding Wizard
  └─ GET /school/onboarding
     └─ Load: SchoolOnboardingStatus query + school data
     └─ Each step uses existing mutations
     └─ "Finish Setup" → /school/dashboard

Dashboard
  └─ GET /school/dashboard
     └─ Load: SchoolOnboardingStatus + school overview
     └─ Show checklist card if onboarding_completed_at is null
     └─ "Dismiss" → sets onboarding_completed_at
```

---

## 6. Security

- `RegisterSchoolManager` is unauthenticated (like login/register)
- All wizard mutations require authentication + school_manager role
- Rate limit registration endpoint to prevent abuse
- Email validation on school manager registration
