# Full Backend Refactor Design

## Overview
Split `User` model into separate `Teacher` and `Parent` models with fully separate tables. Consolidate all pending changes: gems, i18n, Devise admin, classroom_students join table, international school address, and country gem.

## 1. Database Schema

### Drop
- `users` table (replaced by `teachers` + `parents`)

### New Tables

#### `teachers`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| name | string | not null |
| email | string | not null, unique |
| password_digest | string | not null (bcrypt) |
| school_id | bigint | FK → schools, nullable (assigned later) |
| timestamps | | |

#### `parents`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| name | string | not null |
| email | string | not null, unique |
| password_digest | string | not null (bcrypt) |
| phone | string | nullable |
| timestamps | | |

#### `classroom_students` (join table)
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| student_id | bigint | FK → students, not null |
| classroom_id | bigint | FK → classrooms, not null |
| status | integer | 0=active, 1=inactive, not null, default 0 |
| academic_year | string | e.g. "2025/2026", not null |
| enrolled_at | date | not null |
| left_at | date | nullable |
| timestamps | | |

Unique partial index: (student_id, status) WHERE status = 0

### Modified Tables

#### `schools` — add international address
| Column | Type | Notes |
|--------|------|-------|
| address_line1 | string | Street address |
| address_line2 | string | Apt/suite/unit |
| city | string | City/town |
| state_province | string | State/province/region |
| postal_code | string | ZIP/postal code |
| country_code | string | ISO 3166-1 alpha-2 (e.g. "ID", "US") |
| latitude | decimal(10,7) | GPS |
| longitude | decimal(10,7) | GPS |
| phone | string | |
| email | string | |
| website | string | |

#### `students` — remove classroom_id
No longer has direct FK to classrooms. Relationship via classroom_students.

#### `classrooms` — FK changes
`teacher_id` → FK to `teachers` (was `users`)

#### `daily_scores` — FK changes
`teacher_id` → FK to `teachers` (was `users`)

#### `parent_students` — FK changes
`parent_id` → FK to `parents` (was `users`)

#### `refresh_tokens` — polymorphic
Replace `user_id` with:
- `authenticatable_type` (string: "Teacher" or "Parent")
- `authenticatable_id` (bigint)

#### `permissions` — polymorphic
Replace `user_id` with:
- `permissionable_type` (string: "Teacher" or "Parent")
- `permissionable_id` (bigint)

#### `admin_users` — unchanged (Devise)

## 2. Models

- `Teacher` — has_secure_password, has_many :classrooms, has_many :daily_scores, has_many :refresh_tokens (as: :authenticatable), has_many :permissions (as: :permissionable), include Permissionable
- `Parent` — has_secure_password, has_many :parent_students, has_many :children (through: :parent_students), has_many :refresh_tokens (as: :authenticatable), has_many :permissions (as: :permissionable), include Permissionable
- `ClassroomStudent` — belongs_to :student, belongs_to :classroom, enum :status, scopes: current/historical
- `Student` — has_many :classroom_students, current_classroom helper, enroll! method
- `Classroom` — has_many :students through classroom_students (active only)
- `School` — validates country_code with `countries` gem, full_address helper

## 3. Auth

### Separate endpoints
- `POST /api/v1/teachers/auth/login|register|refresh`
- `POST /api/v1/parents/auth/login|register|refresh`

### JWT payload
`{ sub: <id>, type: "Teacher"|"Parent" }`

### Authenticatable concern
Decodes JWT, reads `type` field, loads Teacher or Parent accordingly.

## 4. Routes

```ruby
namespace :api do
  namespace :v1 do
    # Teacher auth
    namespace :teachers do
      post "auth/login", to: "auth#login"
      post "auth/register", to: "auth#register"
      post "auth/refresh", to: "auth#refresh"
    end

    # Parent auth
    namespace :parents do
      post "auth/login", to: "auth#login"
      post "auth/register", to: "auth#register"
      post "auth/refresh", to: "auth#refresh"
      resources :children, only: [:index]
    end

    # Shared resources (auth via JWT, type determines access)
    resources :classrooms, only: [:index, :show] do
      get :overview, on: :member
      resources :students, only: [:index], controller: "classrooms/students"
    end
    resources :daily_scores, only: [:create, :update]
    resources :students, only: [:show] do
      get :radar, on: :member
      get :progress, on: :member
      resources :daily_scores, only: [:index], controller: "students/daily_scores"
    end

    # Admin
    namespace :admin do
      # permissions use polymorphic — need type + id
    end
  end
end

# Devise admin web
devise_for :admin_users, path: "admin"
namespace :admin do
  root to: "dashboard#index"
end
```

## 5. Permissions

RolePermissions::DEFAULTS changes keys from symbols to class names:
- `"Teacher"` → { classrooms: [...], students: [...], daily_scores: [...] }
- `"Parent"` → { students: [...], daily_scores: [...], children: [...] }

Permissionable concern works on both Teacher and Parent via polymorphic permissions.

## 6. Gems & Config

All gems from previous session re-applied: paper_trail, ruby_llm, sentry, secure_headers, lockbox, blind_index, lograge, dotenv-rails, devise, countries, test gems.

## 7. i18n

en.yml + id.yml with all error messages. Localizable concern reads Accept-Language header.
