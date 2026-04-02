# GrewMe — Kids Learning Radar App

## Design Document

**Date:** 2026-03-03
**Status:** Approved

---

## Overview

GrewMe is an education app inspired by Mobile Legends' skill radar chart. Teachers input daily skill scores for students (ages 5-7), and parents view their child's progress via a radar chart on mobile.

**No kid-facing app.** Kids learn in class. Teachers evaluate and input scores from their phone. Parents see the results.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rails 8.1.2 (Ruby 4.0.1) API mode + PostgreSQL |
| Teacher App | Kotlin Multiplatform (KMP) — iOS + Android |
| Parent App | Kotlin Multiplatform (KMP) — iOS + Android |
| Monorepo | `/backend`, `/mobile-app-teacher`, `/mobile-app-parent` |

## Radar Chart — 5 Skill Axes

| Skill | Description |
|-------|-------------|
| **Reading** | Letter recognition, phonics, simple words |
| **Math** | Counting, basic addition/subtraction, shapes |
| **Writing** | Tracing letters, forming words |
| **Logic / Problem Solving** | Puzzles, patterns, sequencing |
| **Social Skills** | Sharing, teamwork, communication |

Each skill scored **0–100**, derived from teacher's daily input.

## User Roles & Apps

### Teacher (KMP Mobile App)

- Login (email/password)
- Select class → select student → input daily scores
- Quick input: slider or number pad per skill, submit all 5 at once
- View individual student radar chart
- Class overview: all students' radar charts side by side
- Optional daily notes per student

### Parent (KMP Mobile App)

- Login (email/password)
- View child's radar chart (current snapshot)
- Progress over time (weekly/monthly trend lines)
- View daily score history
- Support for multiple children

### Admin (Rails Web — optional future)

- Manage schools, classrooms, teacher accounts
- Bulk student import
- System-level reports

## Data Model

```
schools
├── id (PK)
├── name
├── created_at, updated_at

classrooms
├── id (PK)
├── name
├── school_id (FK → schools)
├── teacher_id (FK → users)
├── created_at, updated_at

users
├── id (PK)
├── name
├── email (unique)
├── password_digest
├── role (enum: teacher, parent, admin)
├── created_at, updated_at

students
├── id (PK)
├── name
├── classroom_id (FK → classrooms)
├── avatar (optional)
├── created_at, updated_at

parent_students (join table)
├── id (PK)
├── parent_id (FK → users, role=parent)
├── student_id (FK → students)

daily_scores
├── id (PK)
├── student_id (FK → students)
├── teacher_id (FK → users, role=teacher)
├── date (date)
├── skill_category (enum: reading, math, writing, logic, social)
├── score (integer, 0-100)
├── notes (text, optional)
├── created_at, updated_at
├── UNIQUE INDEX (student_id, date, skill_category)

skill_summaries (materialized view / cached)
├── student_id
├── skill_category
├── avg_score
├── period (week/month/all_time)
├── calculated_at
```

## Score Calculation

```sql
-- Radar chart value per axis
SELECT skill_category, AVG(score) as avg_score
FROM daily_scores
WHERE student_id = ?
  AND date BETWEEN ? AND ?
GROUP BY skill_category;
```

Teacher can also manually adjust scores for skills observed in class but not digitally assessed (e.g., social skills).

## API Endpoints

### Authentication
```
POST   /api/v1/auth/login           # JWT login (email + password)
POST   /api/v1/auth/register        # Registration
POST   /api/v1/auth/refresh         # Refresh token
```

### Teacher Endpoints
```
GET    /api/v1/classrooms                      # My classes
GET    /api/v1/classrooms/:id/students         # Students in class
POST   /api/v1/daily_scores                    # Submit daily scores (batch)
PUT    /api/v1/daily_scores/:id                # Update a score
GET    /api/v1/students/:id/radar              # Student radar chart data
GET    /api/v1/students/:id/daily_scores       # Score history
GET    /api/v1/classrooms/:id/overview         # All students' radar data
```

### Parent Endpoints
```
GET    /api/v1/parents/children                # My children
GET    /api/v1/students/:id/radar              # Child's radar chart
GET    /api/v1/students/:id/progress           # Trend over time
GET    /api/v1/students/:id/daily_scores       # Daily score history
```

## MVP Flow

```
Teacher opens app → picks class → picks student
  → inputs 5 skill scores for today → submits
    → radar chart updates immediately
      → parent sees updated chart on their app
```

## Project Structure

```
grewme/
├── backend/                    # Rails 8.1.2 API + PostgreSQL
│   ├── app/
│   │   ├── controllers/api/v1/
│   │   ├── models/
│   │   └── serializers/
│   ├── db/
│   │   └── migrate/
│   └── config/
├── mobile-app-teacher/         # KMP — Teacher app
│   ├── composeApp/             # Compose Multiplatform UI
│   ├── iosApp/                 # iOS entry point
│   └── shared/                 # Shared Kotlin code
├── mobile-app-parent/          # KMP — Parent app
│   ├── composeApp/             # Compose Multiplatform UI
│   ├── iosApp/                 # iOS entry point
│   └── shared/                 # Shared Kotlin code
└── docs/                       # Design docs & plans
```
