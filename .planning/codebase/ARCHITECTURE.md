# Architecture

**Analysis Date:** 2026-03-04

## Pattern Overview

**Overall:** Client-Server API Architecture — Rails JSON API backend serving two independent Kotlin Multiplatform mobile clients via REST + JWT.

**Key Characteristics:**
- API-only Rails backend (no views/assets) with versioned REST endpoints under `/api/v1/`
- Two separate KMP mobile apps (teacher + parent) consuming the same backend API
- JWT token-based authentication — stateless, no server-side sessions
- PostgreSQL as single relational database with foreign key constraints
- Role-based access control (`teacher`, `parent`, `admin`) using a single `users` table with integer enum
- No shared code module between the two mobile apps (duplicate dependencies)

## Layers

**API Layer (Controllers):**
- Purpose: Handle HTTP requests, authentication, authorization, JSON responses
- Location: `backend/app/controllers/api/v1/`
- Contains: Versioned REST controllers namespaced under `Api::V1`
- Depends on: Models, Services, Authenticatable concern
- Used by: Mobile clients via HTTP

**Authentication Concern:**
- Purpose: JWT token extraction, validation, and user resolution for protected endpoints
- Location: `backend/app/controllers/concerns/authenticatable.rb`
- Contains: `authenticate_user!`, `current_user`, `authorize_role!` methods
- Depends on: `JwtService`, `User` model
- Used by: All controllers (included via `ApplicationController`)

**Service Layer:**
- Purpose: Encapsulate business logic outside controllers
- Location: `backend/app/services/`
- Contains: `JwtService` — JWT encoding/decoding with HS256
- Depends on: `jwt` gem, Rails credentials
- Used by: `AuthController`, `Authenticatable` concern

**Model Layer:**
- Purpose: Data access, validations, associations, business queries
- Location: `backend/app/models/`
- Contains: 6 ActiveRecord models (School, User, Classroom, Student, ParentStudent, DailyScore)
- Depends on: PostgreSQL via ActiveRecord
- Used by: Controllers, Services

**Mobile Presentation Layer (per app):**
- Purpose: Cross-platform UI rendering
- Location: `mobile-app-teacher/composeApp/src/commonMain/` and `mobile-app-parent/composeApp/src/commonMain/`
- Contains: Compose Multiplatform `@Composable` functions
- Depends on: Material3, Ktor (networking), Koin (DI), Navigation Compose
- Used by: Android (`androidMain`) and iOS (`iosMain`) platform entry points

## Data Flow

**Teacher Score Submission (planned):**

1. Teacher opens app → authenticates via `POST /api/v1/auth/login` → receives JWT token
2. Teacher selects classroom via `GET /api/v1/classrooms` → selects student
3. Teacher inputs 5 skill scores (reading, math, writing, logic, social) → `POST /api/v1/daily_scores` (batch)
4. Backend validates scores (0-100 range, unique per student/date/skill) → persists to `daily_scores` table
5. Radar chart updates via `GET /api/v1/students/:id/radar`

**Parent Viewing (planned):**

1. Parent authenticates via `POST /api/v1/auth/login` → receives JWT token
2. Parent fetches children via `GET /api/v1/parents/children` (scoped through `parent_students` join table)
3. Parent views radar chart via `GET /api/v1/students/:id/radar` → backend returns averaged scores per skill
4. Parent views trends via `GET /api/v1/students/:id/progress` → returns weekly/monthly aggregations

**Authentication Flow:**

1. Client sends `POST /api/v1/auth/login` with `{ email, password }`
2. `AuthController` finds user by email, calls `user.authenticate(password)` (bcrypt)
3. On success: `JwtService.encode(user_id:, role:)` creates JWT with 24-hour expiry
4. Client stores JWT, sends in `Authorization: Bearer <token>` header for subsequent requests
5. `Authenticatable` concern extracts token → `JwtService.decode` → loads `@current_user`
6. Role-based authorization via `authorize_role!(:teacher)` etc.

**State Management (Mobile — planned):**
- ViewModels manage screen state via `androidx.lifecycle.viewmodel`
- Ktor HTTP client handles API communication
- Koin provides dependency injection for repositories/ViewModels
- Navigation Compose handles screen routing
- Token persistence: not yet implemented (needs platform-specific secure storage)

## Database Schema

**Entity Relationship:**

```
schools (1) ──< classrooms (N) ──< students (N) ──< daily_scores (N)
                    │                    │
                    │                    ├──< parent_students >── users (parents)
                    │
                    └── users (teacher, via teacher_id FK)

users (teacher, parent, admin - single table with role enum)
```

**Tables:**

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `schools` | School entity | — |
| `users` | All user roles (teacher/parent/admin) | `email` (unique) |
| `classrooms` | Class belonging to school + teacher | `school_id`, `teacher_id` |
| `students` | Students in a classroom | `classroom_id` |
| `parent_students` | Join table: parent ↔ student | `(parent_id, student_id)` unique |
| `daily_scores` | Per-skill daily scores from teacher | `(student_id, date, skill_category)` unique, `student_id`, `teacher_id` |

**Skill Categories (integer enum):**
- `0` = reading, `1` = math, `2` = writing, `3` = logic, `4` = social

**Radar Data Query (in `Student#radar_data`):**
```ruby
daily_scores.where(date: start..end).group(:skill_category).average(:score)
```

## Key Abstractions

**User Role System:**
- Purpose: Single polymorphic user model supporting teacher, parent, and admin roles
- Examples: `backend/app/models/user.rb`
- Pattern: ActiveRecord integer enum (`teacher: 0, parent: 1, admin: 2`) with role-specific associations via foreign keys

**DailyScore as Core Domain Object:**
- Purpose: Atomic unit of skill assessment — one score per student per skill per day
- Examples: `backend/app/models/daily_score.rb`
- Pattern: Composite unique constraint `(student_id, date, skill_category)` enforced at both model and DB level

**JWT Authentication:**
- Purpose: Stateless token-based auth for mobile clients
- Examples: `backend/app/services/jwt_service.rb`, `backend/app/controllers/concerns/authenticatable.rb`
- Pattern: Service object (`JwtService`) + controller concern (`Authenticatable`) with `before_action` hook

**KMP Platform Abstraction:**
- Purpose: Share UI code across Android and iOS
- Examples: `mobile-app-teacher/composeApp/src/commonMain/` (shared), `androidMain/` (Android), `iosMain/` (iOS)
- Pattern: Compose Multiplatform with platform-specific entry points (`MainActivity` for Android, `MainViewController` for iOS)

## Entry Points

**Backend API:**
- Location: `backend/config/routes.rb`
- Triggers: HTTP requests from mobile clients
- Responsibilities: Routes all `/api/v1/*` requests to namespaced controllers
- Server: Puma on port 3000 (`backend/config/puma.rb`)

**Teacher App — Android:**
- Location: `mobile-app-teacher/composeApp/src/androidMain/kotlin/com/grewme/teacher/MainActivity.kt`
- Triggers: Android OS launches activity
- Responsibilities: Calls `enableEdgeToEdge()` + `setContent { App() }`

**Teacher App — iOS:**
- Location: `mobile-app-teacher/composeApp/src/iosMain/kotlin/com/grewme/teacher/MainViewController.kt`
- Triggers: iOS app launch
- Responsibilities: Returns `ComposeUIViewController { App() }`

**Teacher App — Shared:**
- Location: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/App.kt`
- Triggers: Called by platform entry points
- Responsibilities: Root `@Composable` function with `MaterialTheme` + app content

**Parent App — Android:**
- Location: `mobile-app-parent/composeApp/src/androidMain/kotlin/com/grewme/parent/MainActivity.kt`
- Triggers: Android OS launches activity
- Responsibilities: Calls `enableEdgeToEdge()` + `setContent { App() }`

**Parent App — iOS:**
- Location: `mobile-app-parent/composeApp/src/iosMain/kotlin/com/grewme/parent/MainViewController.kt`
- Triggers: iOS app launch
- Responsibilities: Returns `ComposeUIViewController { App() }`

**Parent App — Shared:**
- Location: `mobile-app-parent/composeApp/src/commonMain/kotlin/com/grewme/parent/App.kt`
- Triggers: Called by platform entry points
- Responsibilities: Root `@Composable` function with `MaterialTheme` + app content

## API Design

**Versioning:** URL-based — `/api/v1/` prefix. Controllers namespaced as `Api::V1::*`.

**Authentication:** JWT Bearer tokens in `Authorization` header. 24-hour expiry. HS256 algorithm.

**Implemented Endpoints:**
- `POST /api/v1/auth/login` — email/password login, returns JWT + user JSON
- `POST /api/v1/auth/register` — create account, returns JWT + user JSON

**Planned Endpoints (from design doc):**
- `GET /api/v1/classrooms` — teacher's classes
- `GET /api/v1/classrooms/:id/students` — students in class
- `POST /api/v1/daily_scores` — batch submit 5 skill scores
- `PUT /api/v1/daily_scores/:id` — update a score
- `GET /api/v1/students/:id/radar` — radar chart data (averaged scores)
- `GET /api/v1/students/:id/daily_scores` — score history
- `GET /api/v1/classrooms/:id/overview` — all students' radar data
- `GET /api/v1/parents/children` — parent's children
- `GET /api/v1/students/:id/progress` — trend over time
- `POST /api/v1/auth/refresh` — token refresh

**Response Format:** Raw JSON (no serializer framework yet — inline `render json:` in controllers)

## Error Handling

**Strategy:** Controller-level rescue with JSON error responses.

**Patterns:**
- Auth failure: `{ error: "Invalid email or password" }` with HTTP 401
- Validation failure: `{ errors: user.errors.full_messages }` with HTTP 422
- Authorization failure: `{ error: "Forbidden" }` with HTTP 403
- JWT decode failure: logged as warning, returns `nil` (causes 401)
- No global exception handler configured yet

## Cross-Cutting Concerns

**Logging:** Rails default logger. JWT decode errors logged at `warn` level in `JwtService`.

**Validation:** ActiveRecord model validations (presence, uniqueness, numericality, format). Database-level constraints (NOT NULL, unique indexes, foreign keys).

**Authentication:** JWT via `Authenticatable` concern, applied globally via `before_action :authenticate_user!` (skipped for public endpoints like login/register).

**Authorization:** Role-based via `authorize_role!` method in `Authenticatable` concern. Not yet applied to any controller beyond auth.

**CORS:** `rack-cors` gem included but configuration is commented out in `backend/config/initializers/cors.rb` — needs to be enabled for mobile app communication.

**Deployment:** Kamal-based Docker deployment configured (`backend/Dockerfile`, `backend/config/deploy.yml`). Production uses separate PostgreSQL databases for cache, queue, and cable.

---

*Architecture analysis: 2026-03-04*
