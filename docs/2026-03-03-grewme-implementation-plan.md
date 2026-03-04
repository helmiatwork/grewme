# GrewMe Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-flow MVP where teachers input daily skill scores for students via mobile, and parents view their child's radar chart progress on a separate mobile app.

**Architecture:** Rails 8.1.2 API backend (Ruby 4.0.1) with PostgreSQL serves two KMP (Kotlin Multiplatform) mobile apps — one for teachers (score input) and one for parents (progress viewing). JWT authentication for both apps.

**Tech Stack:** Rails 8.1.2, Ruby 4.0.1, PostgreSQL, Kotlin Multiplatform, Compose Multiplatform, Ktor, Koin

---

## Phase 1: Backend — Database & Models

### Task 1: Create Database and Core Models

**Files:**
- Create: `backend/db/migrate/*_create_schools.rb`
- Create: `backend/db/migrate/*_create_classrooms.rb`
- Create: `backend/db/migrate/*_create_users.rb`
- Create: `backend/db/migrate/*_create_students.rb`
- Create: `backend/db/migrate/*_create_parent_students.rb`
- Create: `backend/db/migrate/*_create_daily_scores.rb`
- Create: `backend/app/models/school.rb`
- Create: `backend/app/models/classroom.rb`
- Create: `backend/app/models/user.rb`
- Create: `backend/app/models/student.rb`
- Create: `backend/app/models/parent_student.rb`
- Create: `backend/app/models/daily_score.rb`
- Test: `backend/test/models/*`

**Step 1: Generate models via Rails generators**

```bash
cd backend
RBENV_VERSION=4.0.1 bin/rails generate model School name:string
RBENV_VERSION=4.0.1 bin/rails generate model User name:string email:string:uniq password_digest:string role:integer
RBENV_VERSION=4.0.1 bin/rails generate model Classroom name:string school:references teacher:references
RBENV_VERSION=4.0.1 bin/rails generate model Student name:string classroom:references avatar:string
RBENV_VERSION=4.0.1 bin/rails generate model ParentStudent parent:references student:references
RBENV_VERSION=4.0.1 bin/rails generate model DailyScore student:references teacher:references date:date skill_category:integer score:integer notes:text
```

**Step 2: Add constraints to migrations**

- `users.role`: default 0, null false
- `daily_scores.score`: null false
- `daily_scores.skill_category`: null false
- `daily_scores`: unique index on `[student_id, date, skill_category]`
- `classrooms.teacher_id`: references users table
- `parent_students.parent_id`: references users table

**Step 3: Add model validations and associations**

```ruby
# User model
class User < ApplicationRecord
  has_secure_password
  enum :role, { teacher: 0, parent: 1, admin: 2 }
  has_many :classrooms, foreign_key: :teacher_id (for teachers)
  has_many :parent_students, foreign_key: :parent_id (for parents)
  has_many :students, through: :parent_students (for parents)
  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
  validates :role, presence: true
end

# DailyScore model
class DailyScore < ApplicationRecord
  enum :skill_category, { reading: 0, math: 1, writing: 2, logic: 3, social: 4 }
  belongs_to :student
  belongs_to :teacher, class_name: "User"
  validates :score, presence: true, numericality: { in: 0..100 }
  validates :skill_category, presence: true
  validates :date, presence: true
  validates :student_id, uniqueness: { scope: [:date, :skill_category] }
end
```

**Step 4: Run migrations and tests**

```bash
RBENV_VERSION=4.0.1 bin/rails db:create db:migrate
RBENV_VERSION=4.0.1 bin/rails test
```

**Step 5: Commit**

```bash
git add backend/
git commit -m "feat(backend): add core database models — schools, users, classrooms, students, daily_scores"
```

---

### Task 2: JWT Authentication

**Files:**
- Modify: `backend/Gemfile` (add `jwt`, `bcrypt`)
- Create: `backend/app/controllers/api/v1/auth_controller.rb`
- Create: `backend/app/services/jwt_service.rb`
- Create: `backend/app/controllers/application_controller.rb` (add auth concern)
- Test: `backend/test/controllers/api/v1/auth_controller_test.rb`

**Step 1: Add gems**

```ruby
gem "jwt"
gem "bcrypt" # already included for has_secure_password
gem "rack-cors"
```

**Step 2: Create JWT service**

```ruby
# app/services/jwt_service.rb
class JwtService
  SECRET = Rails.application.credentials.secret_key_base

  def self.encode(payload, exp: 24.hours.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET)
  end

  def self.decode(token)
    JWT.decode(token, SECRET).first
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end
end
```

**Step 3: Create auth controller with login/register**

**Step 4: Add authenticate_user! concern to ApplicationController**

**Step 5: Write tests and verify**

```bash
RBENV_VERSION=4.0.1 bin/rails test test/controllers/api/v1/auth_controller_test.rb
```

**Step 6: Commit**

```bash
git commit -m "feat(backend): add JWT authentication with login and register endpoints"
```

---

### Task 3: Teacher API Endpoints

**Files:**
- Create: `backend/app/controllers/api/v1/classrooms_controller.rb`
- Create: `backend/app/controllers/api/v1/students_controller.rb`
- Create: `backend/app/controllers/api/v1/daily_scores_controller.rb`
- Create: `backend/config/routes.rb` (update)
- Test: `backend/test/controllers/api/v1/*`

**Endpoints:**
```
GET    /api/v1/classrooms                      # Teacher's classes
GET    /api/v1/classrooms/:id/students         # Students in class
POST   /api/v1/daily_scores                    # Submit daily scores (batch: 5 skills at once)
PUT    /api/v1/daily_scores/:id                # Update a score
GET    /api/v1/students/:id/radar              # Student radar chart data
GET    /api/v1/students/:id/daily_scores       # Score history
GET    /api/v1/classrooms/:id/overview         # All students' radar data
```

**Step 1: Write failing tests for each endpoint**

**Step 2: Implement controllers**

**Step 3: Add routes**

```ruby
namespace :api do
  namespace :v1 do
    post "auth/login", to: "auth#login"
    post "auth/register", to: "auth#register"

    resources :classrooms, only: [:index, :show] do
      get :students, on: :member
      get :overview, on: :member
    end

    resources :students, only: [:show] do
      get :radar, on: :member
      get :daily_scores, on: :member
    end

    resources :daily_scores, only: [:create, :update]
  end
end
```

**Step 4: Run tests**

**Step 5: Commit**

```bash
git commit -m "feat(backend): add teacher API endpoints — classrooms, students, daily scores"
```

---

### Task 4: Parent API Endpoints

**Files:**
- Create: `backend/app/controllers/api/v1/parents_controller.rb`
- Test: `backend/test/controllers/api/v1/parents_controller_test.rb`

**Endpoints:**
```
GET    /api/v1/parents/children                # Parent's children
GET    /api/v1/students/:id/radar              # Reuse from Task 3
GET    /api/v1/students/:id/progress           # Trend over time (weekly/monthly)
GET    /api/v1/students/:id/daily_scores       # Reuse from Task 3
```

**Step 1: Write failing tests**

**Step 2: Implement parents controller + progress endpoint**

Progress endpoint returns:
```json
{
  "student_id": 1,
  "period": "monthly",
  "data": [
    { "week": "2026-W09", "reading": 75, "math": 82, "writing": 68, "logic": 90, "social": 71 },
    { "week": "2026-W10", "reading": 78, "math": 85, "writing": 72, "logic": 88, "social": 75 }
  ]
}
```

**Step 3: Add authorization — parents can only see their own children**

**Step 4: Run tests**

**Step 5: Commit**

```bash
git commit -m "feat(backend): add parent API endpoints — children list, progress trends"
```

---

### Task 5: Seed Data

**Files:**
- Modify: `backend/db/seeds.rb`

Create realistic seed data:
- 1 school
- 2 classrooms
- 2 teachers
- 10 students (5 per class)
- 3 parents (linked to students)
- 30 days of daily scores for each student

**Commit:**
```bash
git commit -m "feat(backend): add seed data for development"
```

---

## Phase 2: Teacher Mobile App (KMP)

### Task 6: Networking Layer (Teacher App)

**Files:**
- Create: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/data/api/ApiClient.kt`
- Create: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/data/api/AuthApi.kt`
- Create: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/data/api/TeacherApi.kt`
- Create: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/data/model/*.kt`

Set up Ktor client with JWT token management, request/response models using kotlinx.serialization.

**Commit:**
```bash
git commit -m "feat(teacher-app): add networking layer with Ktor client and API models"
```

---

### Task 7: Authentication Screens (Teacher App)

**Files:**
- Create: `mobile-app-teacher/.../ui/auth/LoginScreen.kt`
- Create: `mobile-app-teacher/.../ui/auth/LoginViewModel.kt`
- Create: `mobile-app-teacher/.../data/repository/AuthRepository.kt`

Login screen with email/password, JWT token storage.

**Commit:**
```bash
git commit -m "feat(teacher-app): add login screen with JWT authentication"
```

---

### Task 8: Classroom & Student List (Teacher App)

**Files:**
- Create: `mobile-app-teacher/.../ui/classroom/ClassroomListScreen.kt`
- Create: `mobile-app-teacher/.../ui/classroom/StudentListScreen.kt`
- Create: `mobile-app-teacher/.../ui/classroom/ClassroomViewModel.kt`

Teacher selects classroom → sees list of students.

**Commit:**
```bash
git commit -m "feat(teacher-app): add classroom and student list screens"
```

---

### Task 9: Daily Score Input (Teacher App)

**Files:**
- Create: `mobile-app-teacher/.../ui/score/DailyScoreInputScreen.kt`
- Create: `mobile-app-teacher/.../ui/score/DailyScoreViewModel.kt`

5 sliders (one per skill), submit button. Quick and easy input for teachers.

**Commit:**
```bash
git commit -m "feat(teacher-app): add daily score input screen with 5 skill sliders"
```

---

### Task 10: Radar Chart & Student Detail (Teacher App)

**Files:**
- Create: `mobile-app-teacher/.../ui/chart/RadarChart.kt` (custom Compose Canvas drawing)
- Create: `mobile-app-teacher/.../ui/student/StudentDetailScreen.kt`
- Create: `mobile-app-teacher/.../ui/classroom/ClassOverviewScreen.kt`

Custom radar chart drawn with Compose Canvas. Shows 5 axes with skill scores.

**Commit:**
```bash
git commit -m "feat(teacher-app): add radar chart component and student detail screen"
```

---

### Task 11: Navigation (Teacher App)

**Files:**
- Modify: `mobile-app-teacher/.../App.kt`
- Create: `mobile-app-teacher/.../navigation/NavGraph.kt`

Wire all screens together: Login → Classrooms → Students → Score Input / Student Detail.

**Commit:**
```bash
git commit -m "feat(teacher-app): add navigation graph connecting all screens"
```

---

## Phase 3: Parent Mobile App (KMP)

### Task 12: Networking Layer (Parent App)

Same pattern as Task 6 but for parent endpoints.

**Commit:**
```bash
git commit -m "feat(parent-app): add networking layer with Ktor client and API models"
```

---

### Task 13: Authentication (Parent App)

Login screen for parents.

**Commit:**
```bash
git commit -m "feat(parent-app): add login screen with JWT authentication"
```

---

### Task 14: Children List & Radar Chart (Parent App)

**Files:**
- Create: `mobile-app-parent/.../ui/children/ChildrenListScreen.kt`
- Create: `mobile-app-parent/.../ui/chart/RadarChart.kt` (shared radar chart component)
- Create: `mobile-app-parent/.../ui/child/ChildDetailScreen.kt`

Parent sees list of children → taps child → sees radar chart.

**Commit:**
```bash
git commit -m "feat(parent-app): add children list and radar chart screens"
```

---

### Task 15: Progress & History (Parent App)

**Files:**
- Create: `mobile-app-parent/.../ui/progress/ProgressScreen.kt`
- Create: `mobile-app-parent/.../ui/history/ScoreHistoryScreen.kt`

Weekly/monthly trend lines showing skill progression over time.

**Commit:**
```bash
git commit -m "feat(parent-app): add progress trends and score history screens"
```

---

### Task 16: Navigation (Parent App)

Wire all screens: Login → Children → Child Detail (Radar) → Progress/History.

**Commit:**
```bash
git commit -m "feat(parent-app): add navigation graph connecting all screens"
```

---

## Phase 4: Polish & Integration

### Task 17: End-to-End Testing

- Start Rails server
- Test teacher app flow: login → select class → input scores
- Test parent app flow: login → view child → see radar chart
- Verify scores from teacher appear in parent app

### Task 18: Error Handling & Loading States

Add proper error handling, loading spinners, empty states across both apps.

### Task 19: Final Commit & Documentation

```bash
git commit -m "feat: complete GrewMe MVP — teacher score input + parent radar chart viewing"
```
