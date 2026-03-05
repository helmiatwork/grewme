# Head of School / School Manager — Design

**Date**: 2026-03-05
**Status**: Approved
**Approach**: New `SchoolManager` model (Approach A)

## Summary

Add a Head of School role as a separate `SchoolManager` model with full read/write access to everything within their school. They do not teach classes — they observe and manage across the entire school.

## Requirements

- Separate role from Teacher/Parent (own model, own JWT type, own routes)
- Scoped to exactly one school
- Can view all classrooms, students, radar charts, progress, daily scores, feed posts, calendar events
- Can create feed posts and calendar events in any school classroom
- Can manage teachers (assign/remove from classrooms)
- Can manage students (transfer between classrooms)
- Gets own `/school/*` frontend route group with dedicated dashboard

## Data Model

### New table: `school_managers`

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint | PK |
| name | string | NOT NULL |
| email | string | NOT NULL, unique |
| encrypted_password | string | NOT NULL |
| school_id | bigint FK | NOT NULL |
| phone | string | |
| bio | text | |
| birthdate | date | |
| gender | string | |
| qualification | string | |
| address_line1..country_code | string | (same as Teacher) |
| reset_password_token | string | unique |
| reset_password_sent_at | datetime | |
| remember_created_at | datetime | |
| timestamps | | |

### Model

```ruby
class SchoolManager < ApplicationRecord
  include Permissionable

  devise :database_authenticatable, :recoverable, :rememberable, :validatable

  belongs_to :school
  has_many :refresh_tokens, as: :authenticatable, dependent: :destroy
  has_many :classroom_events, as: :creator, dependent: :nullify
  has_many :feed_posts, as: :author, dependent: :nullify  # if feed supports polymorphic author
  has_one_attached :avatar_image

  def role = "school_manager"
  def school_manager? = true
  def teacher? = false
  def parent? = false
  def admin? = false
end
```

## Auth & JWT

- JWT type: `"SchoolManager"`
- `find_authenticatable` already uses `type.safe_constantize` — works automatically
- Add to `UserUnion`: `possible_types SchoolManagerType`
- Login/refresh/logout mutations work polymorphically — no changes needed

## Policy Changes

Every policy gets a `school_manager?` branch scoped to `user.school`:

| Policy | SchoolManager Scope |
|--------|-------------------|
| ClassroomPolicy | `Classroom.where(school: user.school)` |
| StudentPolicy | Students in school's classrooms |
| DailyScorePolicy | Scores in school's classrooms |
| ClassroomEventPolicy | Events in school's classrooms; create in any; delete own |
| FeedPostPolicy | Posts in school's classrooms; create in any |

## Role Permission Defaults

```ruby
"school_manager" => {
  "classrooms" => %w[index show overview],
  "students" => %w[index show radar progress],
  "daily_scores" => %w[index],
  "feed_posts" => %w[index show create],
  "calendar_events" => %w[index create destroy],
  "teachers" => %w[index show manage],
  "school" => %w[show manage]
}
```

## GraphQL

### Updated queries (add school_manager? branch)
- `classrooms` — all school classrooms
- `classroomEvents` — all school events
- `feedPosts` — all school feed posts
- `me` — already works via UserUnion

### New types
- `SchoolManagerType` — profile fields + avatarUrl

### New queries
- `schoolOverview` — school stats (classroom count, student count, teacher count)
- `schoolTeachers` — list teachers in the school

### New mutations
- `assignTeacherToClassroom(teacherId, classroomId, role)`
- `removeTeacherFromClassroom(teacherId, classroomId)`
- `transferStudent(studentId, fromClassroomId, toClassroomId)`

## Frontend Routes

```
/school/dashboard     — School overview (stats, classrooms grid)
/school/classrooms    — All classrooms, click into detail
/school/teachers      — Teacher list, assign to classrooms
/school/students      — All students, transfer between classrooms
/school/feed          — School-wide feed
/school/calendar      — School-wide calendar
/school/profile       — HoS profile page
```

Nav: Dashboard, Classrooms, Teachers, Students, Feed, Calendar, Profile

## Seeds

```
Principal Pat — pat@greenwood.edu / password123 (Greenwood Elementary)
```

## Sequencing

1. Finish calendar feature first (in progress)
2. Then implement Head of School
