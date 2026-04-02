# Design: Yearly Curriculum with Drag & Drop

## Overview

Separate curriculum into two layers:
1. **Curriculum Master** (existing) — reusable library of all subjects, topics, and learning objectives a school offers
2. **Yearly Curriculum** (new) — per grade level, per academic year selection of what's actually taught

School managers and teachers drag subjects/topics from the master into a grade's yearly curriculum using a split-panel drag-and-drop UI.

## Data Model

### New Tables

```
AcademicYear
  - id
  - school_id (FK → schools)
  - label: string ("2025/2026")
  - start_date: date
  - end_date: date
  - current: boolean (default false, max one per school)
  - timestamps
  - unique index: [school_id, label]

GradeCurriculum
  - id
  - academic_year_id (FK → academic_years)
  - grade: integer (1-12)
  - timestamps
  - unique index: [academic_year_id, grade]

GradeCurriculumItem
  - id
  - grade_curriculum_id (FK → grade_curriculums)
  - subject_id (FK → subjects, nullable)
  - topic_id (FK → topics, nullable)
  - position: integer (for ordering)
  - timestamps
  - check constraint: exactly one of subject_id/topic_id must be non-null
  - unique index: [grade_curriculum_id, subject_id, topic_id]
```

### Modified Tables

```
School (add fields)
  + min_grade: integer (e.g., 1 for elementary)
  + max_grade: integer (e.g., 6 for elementary)

Classroom (add field)
  + grade: integer (1-12)
```

### Grade Display Names (helper, no DB)

| Grade | Level | Display |
|-------|-------|---------|
| 1-6   | Elementary | ELM 1 — ELM 6 |
| 7-9   | Junior High | JHS 1 — JHS 3 |
| 10-12 | Senior High | SHS 1 — SHS 3 |

Derived from integer: `grade <= 6 → "ELM #{grade}"`, `grade <= 9 → "JHS #{grade - 6}"`, `grade <= 12 → "SHS #{grade - 9}"`

## Associations

```
School
  has_many :academic_years

AcademicYear
  belongs_to :school
  has_many :grade_curriculums

GradeCurriculum
  belongs_to :academic_year
  has_many :grade_curriculum_items

GradeCurriculumItem
  belongs_to :grade_curriculum
  belongs_to :subject, optional: true
  belongs_to :topic, optional: true
```

## GraphQL API

### Queries

```graphql
# Get academic years for a school
academicYears(schoolId: ID!): [AcademicYear!]!

# Get the yearly curriculum for a specific grade + academic year
gradeCurriculum(academicYearId: ID!, grade: Int!): GradeCurriculum
```

### Mutations

```graphql
# Academic year CRUD
createAcademicYear(input: CreateAcademicYearInput!): AcademicYearPayload!
updateAcademicYear(input: UpdateAcademicYearInput!): AcademicYearPayload!
setCurrentAcademicYear(id: ID!): AcademicYearPayload!

# Yearly curriculum management (bulk save from drag & drop)
saveGradeCurriculum(input: SaveGradeCurriculumInput!): GradeCurriculumPayload!
```

### Input Types

```graphql
input SaveGradeCurriculumInput {
  academicYearId: ID!
  grade: Int!
  items: [GradeCurriculumItemInput!]!
}

input GradeCurriculumItemInput {
  subjectId: ID    # set for whole-subject inclusion
  topicId: ID      # set for individual topic inclusion
  position: Int!
}
```

The `saveGradeCurriculum` mutation replaces all items for that grade+year in one transaction (idempotent save from the drag-and-drop UI).

## Permissions

```ruby
# role_permissions.rb additions
"academic_years" => %w[index show create update],     # school_manager, teacher
"grade_curriculums" => %w[index show create update],   # school_manager, teacher
```

Parents get read-only access (index, show) to see their child's grade curriculum.

## Frontend Routes

| Route | Role | Purpose |
|-------|------|---------|
| `/school/curriculum/yearly` | School Manager | Drag & drop yearly curriculum builder |
| `/teacher/curriculum/yearly` | Teacher | Drag & drop yearly curriculum builder |
| `/parent/curriculum/yearly` | Parent | Read-only view of child's grade curriculum |
| `/school/settings/academic-years` | School Manager | Manage academic years (CRUD) |

## UI: Drag & Drop Page

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Academic Year: [2025/2026 ▼]   Grade: [ELM 1 ▼]    │
├────────────────────────┬────────────────────────────┤
│  CURRICULUM MASTER     │  YEARLY CURRICULUM         │
│  (drag from here)      │  (drop here)               │
│                        │                            │
│  ▼ Mathematics         │  1. Mathematics (all)   ✕  │
│    ├ Numbers & Ops  ⋮  │  2. Reading Comp.       ✕  │
│    ├ Geometry        ⋮  │  3. Writing             ✕  │
│    └ Patterns        ⋮  │                            │
│  ▼ English             │  ┌──────────────────────┐  │
│    ├ Reading         ⋮  │  │ Drop subjects or     │  │
│    ├ Writing         ⋮  │  │ topics here          │  │
│    └ Vocabulary      ⋮  │  └──────────────────────┘  │
│  ▼ Science             │                            │
│    ├ Living Things   ⋮  │                            │
│    └ Matter & Energy ⋮  │                            │
├────────────────────────┴────────────────────────────┤
│                      [Save Curriculum]               │
└─────────────────────────────────────────────────────┘
```

### Interactions

- **Drag subject** → adds to right panel as "Subject Name (all topics)"
- **Drag individual topic** → adds to right panel as just that topic
- **Reorder** items in right panel via drag
- **Remove** item via ✕ button
- **Save** sends all items to `saveGradeCurriculum` mutation
- Items already in yearly curriculum are visually dimmed in the master panel
- If a subject is fully included, its individual topics can't be separately added (and vice versa)

### Tech: Drag & Drop

Use **svelte-dnd-action** — mature Svelte DnD library supporting zones, groups, and Svelte 5.

### Parent View

Same layout but:
- No drag handles on master panel items
- No drop zone / ✕ buttons on yearly panel
- No Save button
- Grade auto-selected from child's classroom grade

## Academic Year Settings Page

Simple CRUD page at `/school/settings/academic-years`:
- List of academic years with label, dates, current badge
- Create new year form (label, start date, end date)
- "Set as Current" button
- Edit/delete existing years

## Seed Data Updates

```ruby
# Add grade to existing classrooms
Class 1A, 1B → grade: 1
Class 2A, 2B → grade: 2
Class 3A, 3B → grade: 3
Class 4A → grade: 4

# Add grade range to school
Greenwood Elementary: min_grade: 1, max_grade: 6

# Create default academic year
AcademicYear: label "2025/2026", start: 2025-07-01, end: 2026-06-30, current: true
```
