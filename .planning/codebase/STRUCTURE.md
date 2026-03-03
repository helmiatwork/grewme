# Codebase Structure

**Analysis Date:** 2026-03-04

## Directory Layout

```
grewme/
├── backend/                           # Rails 8.1.2 API-only backend
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── api/v1/                # Versioned API controllers
│   │   │   ├── concerns/             # Controller concerns (auth)
│   │   │   └── application_controller.rb
│   │   ├── models/                    # ActiveRecord models
│   │   │   └── concerns/             # Model concerns (empty)
│   │   ├── services/                  # Service objects
│   │   ├── jobs/                      # Background jobs (empty)
│   │   ├── mailers/                   # Email (empty)
│   │   └── views/layouts/             # API layouts only
│   ├── config/
│   │   ├── initializers/              # CORS, filters, inflections
│   │   ├── environments/              # Per-env configs
│   │   ├── routes.rb                  # API route definitions
│   │   ├── database.yml               # PostgreSQL config
│   │   └── application.rb             # Rails config (API mode)
│   ├── db/
│   │   ├── migrate/                   # 6 migration files
│   │   ├── schema.rb                  # Current DB schema
│   │   └── seeds.rb                   # Seed data (empty)
│   ├── test/
│   │   ├── models/                    # Model tests (scaffolded, empty)
│   │   ├── controllers/               # Controller tests (empty)
│   │   ├── fixtures/                  # YAML test fixtures
│   │   ├── integration/               # Integration tests (empty)
│   │   └── test_helper.rb             # Test config
│   ├── lib/tasks/                     # Rake tasks (empty)
│   ├── Gemfile                        # Ruby dependencies
│   ├── Dockerfile                     # Production Docker image
│   └── config.ru                      # Rack entry point
│
├── mobile-app-teacher/                # KMP Teacher app
│   ├── composeApp/
│   │   ├── src/
│   │   │   ├── commonMain/kotlin/com/grewme/teacher/   # Shared Kotlin code
│   │   │   │   └── App.kt                              # Root composable
│   │   │   ├── androidMain/kotlin/com/grewme/teacher/  # Android entry
│   │   │   │   └── MainActivity.kt
│   │   │   └── iosMain/kotlin/com/grewme/teacher/      # iOS entry
│   │   │       └── MainViewController.kt
│   │   └── build.gradle.kts           # Module build config
│   ├── iosApp/iosApp/                 # iOS Xcode project wrapper
│   ├── gradle/libs.versions.toml      # Version catalog
│   ├── build.gradle.kts               # Root build config
│   ├── settings.gradle.kts            # Project settings
│   └── gradle.properties              # Gradle JVM config
│
├── mobile-app-parent/                 # KMP Parent app (identical structure)
│   ├── composeApp/
│   │   ├── src/
│   │   │   ├── commonMain/kotlin/com/grewme/parent/    # Shared Kotlin code
│   │   │   │   └── App.kt                              # Root composable
│   │   │   ├── androidMain/kotlin/com/grewme/parent/   # Android entry
│   │   │   │   └── MainActivity.kt
│   │   │   └── iosMain/kotlin/com/grewme/parent/       # iOS entry
│   │   │       └── MainViewController.kt
│   │   └── build.gradle.kts
│   ├── iosApp/iosApp/
│   ├── gradle/libs.versions.toml
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── gradle.properties
│
├── docs/                              # Design docs and plans
│   ├── 2026-03-03-grewme-design.md    # Product design document
│   ├── 2026-03-03-grewme-implementation-plan.md  # Phase-by-phase plan
│   └── plans/                         # Phase plans (empty)
│
└── .gitignore
```

## Directory Purposes

**`backend/`:**
- Purpose: Rails 8.1.2 API-only application serving JSON to mobile clients
- Contains: Models, controllers, services, migrations, tests
- Key files: `config/routes.rb`, `db/schema.rb`, `app/services/jwt_service.rb`

**`backend/app/controllers/api/v1/`:**
- Purpose: Versioned API endpoint handlers
- Contains: REST controllers namespaced as `Api::V1::*`
- Key files: `auth_controller.rb` (login/register — only controller implemented)

**`backend/app/controllers/concerns/`:**
- Purpose: Shared controller behaviors mixed into controllers
- Contains: `authenticatable.rb` — JWT auth, current_user, role authorization

**`backend/app/models/`:**
- Purpose: ActiveRecord models with validations and associations
- Contains: `user.rb`, `school.rb`, `classroom.rb`, `student.rb`, `parent_student.rb`, `daily_score.rb`

**`backend/app/services/`:**
- Purpose: Service objects encapsulating business logic
- Contains: `jwt_service.rb` — JWT encode/decode

**`backend/db/migrate/`:**
- Purpose: Database migration history
- Contains: 6 migrations creating core tables (schools, users, classrooms, students, parent_students, daily_scores)

**`backend/test/`:**
- Purpose: Minitest test suite
- Contains: Model tests, controller tests, fixtures (all scaffolded, no real tests written)

**`mobile-app-teacher/composeApp/src/commonMain/`:**
- Purpose: Cross-platform shared Kotlin code for teacher app
- Contains: Root `App.kt` composable (placeholder "Coming soon...")
- Future: Will contain `data/`, `ui/`, `navigation/` packages per implementation plan

**`mobile-app-teacher/composeApp/src/androidMain/`:**
- Purpose: Android-specific entry point and platform code
- Contains: `MainActivity.kt` extending `ComponentActivity`

**`mobile-app-teacher/composeApp/src/iosMain/`:**
- Purpose: iOS-specific entry point
- Contains: `MainViewController.kt` returning `ComposeUIViewController`

**`mobile-app-parent/composeApp/src/commonMain/`:**
- Purpose: Cross-platform shared Kotlin code for parent app
- Contains: Root `App.kt` composable (placeholder "Coming soon...")

**`docs/`:**
- Purpose: Product design documents and implementation plans
- Contains: Design spec, phased implementation plan
- Key files: `2026-03-03-grewme-design.md` (data model, API spec, flows)

## Key File Locations

**Entry Points:**
- `backend/config.ru`: Rack server entry point
- `backend/config/routes.rb`: All API route definitions
- `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/App.kt`: Teacher app root
- `mobile-app-parent/composeApp/src/commonMain/kotlin/com/grewme/parent/App.kt`: Parent app root

**Configuration:**
- `backend/config/application.rb`: Rails config (API-only mode)
- `backend/config/database.yml`: PostgreSQL connection settings
- `backend/config/initializers/cors.rb`: CORS policy (currently commented out)
- `backend/config/puma.rb`: Web server config (port 3000)
- `mobile-app-teacher/gradle/libs.versions.toml`: Teacher app dependency versions
- `mobile-app-parent/gradle/libs.versions.toml`: Parent app dependency versions

**Core Logic:**
- `backend/app/models/user.rb`: User model with role enum, has_secure_password
- `backend/app/models/daily_score.rb`: Score model with skill enum, validations
- `backend/app/models/student.rb`: Student model with `radar_data` query method
- `backend/app/services/jwt_service.rb`: JWT encode/decode
- `backend/app/controllers/concerns/authenticatable.rb`: Auth middleware
- `backend/app/controllers/api/v1/auth_controller.rb`: Login/register endpoints

**Database:**
- `backend/db/schema.rb`: Current database schema (source of truth)
- `backend/db/migrate/`: 6 migration files
- `backend/db/seeds.rb`: Seed data (empty — needs implementation)

**Testing:**
- `backend/test/test_helper.rb`: Test configuration
- `backend/test/models/`: Model test files (scaffolded, empty)
- `backend/test/controllers/`: Controller test directory (empty)
- `backend/test/fixtures/`: YAML fixture files (auto-generated, need updating)

## Naming Conventions

**Files (Backend — Ruby):**
- Models: `snake_case.rb` — e.g., `daily_score.rb`, `parent_student.rb`
- Controllers: `snake_case_controller.rb` — e.g., `auth_controller.rb`
- Services: `snake_case_service.rb` — e.g., `jwt_service.rb`
- Migrations: `YYYYMMDDHHMMSS_verb_noun.rb` — e.g., `20260303165751_create_daily_scores.rb`

**Files (Mobile — Kotlin):**
- Entry points: `PascalCase.kt` — e.g., `MainActivity.kt`, `App.kt`
- Package: `com.grewme.teacher` / `com.grewme.parent`

**Directories:**
- Backend: Rails conventions — `app/controllers/`, `app/models/`, `app/services/`
- Mobile: KMP conventions — `commonMain/`, `androidMain/`, `iosMain/`
- API versioning: `api/v1/` directory nesting

## Where to Add New Code

**New API Endpoint (Backend):**
- Controller: `backend/app/controllers/api/v1/{resource}_controller.rb`
- Routes: `backend/config/routes.rb` inside `namespace :api { namespace :v1 { ... } }`
- Tests: `backend/test/controllers/api/v1/{resource}_controller_test.rb`
- Fixtures: `backend/test/fixtures/{resource}.yml`

**New Model (Backend):**
- Model: `backend/app/models/{model_name}.rb`
- Migration: `backend/db/migrate/YYYYMMDDHHMMSS_create_{table}.rb`
- Tests: `backend/test/models/{model_name}_test.rb`
- Fixtures: `backend/test/fixtures/{table}.yml`

**New Service (Backend):**
- Service: `backend/app/services/{service_name}_service.rb`
- Use class method pattern matching `JwtService` (e.g., `self.encode`, `self.decode`)

**New Screen (Teacher App):**
- Screen composable: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/ui/{feature}/{FeatureName}Screen.kt`
- ViewModel: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/ui/{feature}/{FeatureName}ViewModel.kt`
- Repository: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/data/repository/{FeatureName}Repository.kt`
- API client: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/data/api/{FeatureName}Api.kt`
- Navigation: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/navigation/NavGraph.kt`

**New Screen (Parent App):**
- Same structure as teacher app but under `mobile-app-parent/composeApp/src/commonMain/kotlin/com/grewme/parent/`

**New API Data Model (Mobile):**
- Request/Response models: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/data/model/{ModelName}.kt`
- Use `@Serializable` annotation with `kotlinx.serialization`

**Shared UI Component (per app — no shared module):**
- Place in `ui/components/` package within each app's `commonMain`
- The radar chart component exists in both apps but is NOT shared — duplicate implementation required

## Special Directories

**`backend/.kamal/`:**
- Purpose: Kamal deployment configuration
- Generated: Partially (secrets are generated)
- Committed: Yes

**`backend/storage/`:**
- Purpose: Active Storage file uploads
- Generated: Yes (at runtime)
- Committed: No (gitignored)

**`backend/tmp/`:**
- Purpose: Temporary files (cache, PIDs, sockets)
- Generated: Yes (at runtime)
- Committed: No (gitignored)

**`mobile-app-teacher/.gradle/` and `mobile-app-parent/.gradle/`:**
- Purpose: Gradle build cache and metadata
- Generated: Yes
- Committed: No (should be gitignored)

**`docs/plans/`:**
- Purpose: Intended for per-phase implementation plans
- Generated: No
- Committed: Yes (currently empty)

---

*Structure analysis: 2026-03-04*
