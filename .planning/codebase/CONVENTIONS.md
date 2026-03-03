# Coding Conventions

**Analysis Date:** 2026-03-04

## Naming Patterns

### Backend (Ruby on Rails)

**Files:**
- Models: `snake_case` singular — `user.rb`, `daily_score.rb`, `parent_student.rb`
- Controllers: `snake_case` with `_controller` suffix — `auth_controller.rb`
- Concerns: `snake_case` adjective/noun — `authenticatable.rb`
- Services: `snake_case` with `_service` suffix — `jwt_service.rb`
- Migrations: timestamped `create_<table_name>.rb` — `20260303165747_create_users.rb`
- Test files: `<model_name>_test.rb` — `user_test.rb`, `daily_score_test.rb`
- Fixtures: `<table_name>.yml` (plural) — `users.yml`, `daily_scores.yml`

**Classes/Modules:**
- Models: `PascalCase` singular — `User`, `DailyScore`, `ParentStudent`
- Controllers: `PascalCase` with `Controller` suffix — `AuthController`
- Services: `PascalCase` with `Service` suffix — `JwtService`
- Concerns: `PascalCase` adjective — `Authenticatable`

**Methods:**
- `snake_case` throughout — `authenticate_user!`, `extract_token`, `authorize_role!`
- Bang methods (`!`) for methods that raise or halt execution — `authenticate_user!`, `authorize_role!`
- Private helper methods prefixed with context — `register_params`, `user_json`
- Query/scope methods: descriptive — `radar_data`

**Variables:**
- `snake_case` for locals and instance vars — `@current_user`, `token`, `payload`
- Symbols for hash keys — `:user_id`, `:role`, `:email`

**Database:**
- Tables: `snake_case` plural — `users`, `daily_scores`, `parent_students`
- Columns: `snake_case` — `skill_category`, `password_digest`, `teacher_id`
- Foreign keys: `<association>_id` — `teacher_id`, `parent_id`, `student_id`
- Join tables: alphabetical concatenation — `parent_students`
- Indexes: Rails auto-naming or descriptive — `idx_daily_scores_unique`

### Mobile Apps (Kotlin Multiplatform)

**Files:**
- `PascalCase.kt` — `App.kt`, `MainActivity.kt`, `MainViewController.kt`
- Platform-specific in their source sets — `androidMain/`, `iosMain/`, `commonMain/`

**Packages:**
- `com.grewme.teacher` for teacher app
- `com.grewme.parent` for parent app

**Classes:**
- `PascalCase` — `MainActivity`, `MainViewController`
- Activities extend `ComponentActivity`

**Functions:**
- `@Composable` functions use `PascalCase` — `App()`
- Regular functions use `camelCase`

## Code Style

### Backend (Ruby)

**Formatting:**
- Enforced by RuboCop with Rails Omakase preset
- Config: `backend/.rubocop.yml`
- Inherits from `rubocop-rails-omakase`
- No custom overrides defined yet (commented examples only)

**Key Omakase Rules (inherited):**
- 2-space indentation
- Double-quoted strings
- Trailing commas in multi-line collections
- Modern Ruby hash syntax `{ key: value }`
- Frozen string literal comments not required

**Linting:**
- RuboCop: `bin/rubocop` (with `-f github` in CI for GitHub annotations)
- Brakeman: `bin/brakeman` for security static analysis
- Bundler-Audit: `bin/bundler-audit` for gem vulnerability scanning

**CI enforcement:**
- All three tools run in GitHub Actions on every PR and push to `main`
- See `backend/.github/workflows/ci.yml`

### Mobile Apps (Kotlin)

**Formatting:**
- Kotlin official code style enforced via `gradle.properties`: `kotlin.code.style=official`
- No detekt or ktlint configured
- No CI pipeline for mobile apps

## Import Organization

### Backend (Ruby)
- Rails autoloading handles most imports — no explicit `require` in app code
- Test files use: `require "test_helper"` as first line
- Services and concerns are autoloaded from `app/services/` and `app/controllers/concerns/`

### Mobile Apps (Kotlin)
- Wildcard imports used for Compose packages:
  ```kotlin
  import androidx.compose.foundation.layout.*
  import androidx.compose.material3.*
  import androidx.compose.runtime.*
  ```
- Specific imports for individual components:
  ```kotlin
  import androidx.compose.ui.Alignment
  import androidx.compose.ui.Modifier
  import androidx.compose.ui.unit.dp
  ```
- Order: Android/Compose framework → then specific UI components

## Error Handling

### Backend (Ruby)

**Controller-level:**
- Return JSON error responses with appropriate HTTP status codes
- Pattern: `render json: { error: "message" }, status: :unauthorized`
- Validation errors: `render json: { errors: user.errors.full_messages }, status: :unprocessable_entity`

**Service-level:**
- Rescue specific exceptions, return `nil` for failures
- Pattern from `backend/app/services/jwt_service.rb`:
  ```ruby
  rescue JWT::DecodeError, JWT::ExpiredSignature => e
    Rails.logger.warn("JWT decode error: #{e.message}")
    nil
  end
  ```

**Authentication:**
- Before-action pattern with early return on failure
- `authenticate_user!` renders unauthorized and returns if token invalid
- `authorize_role!` renders forbidden if role mismatch

**Current gaps:**
- No global exception handler (no `rescue_from` in `ApplicationController`)
- No standardized error response format across controllers
- No custom error classes defined

### Mobile Apps (Kotlin)
- No error handling patterns implemented yet (placeholder UI only)

## Logging

### Backend (Ruby)

**Framework:** Rails built-in logger (`Rails.logger`)

**Patterns:**
- Security events logged at `warn` level — `Rails.logger.warn("JWT decode error: #{e.message}")`
- Development mode has verbose query logs enabled (`config.active_record.verbose_query_logs = true`)
- Query log tags enabled in development (`config.active_record.query_log_tags_enabled = true`)
- Parameter filtering configured for sensitive data in `backend/config/initializers/filter_parameter_logging.rb`:
  ```ruby
  :passw, :email, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn, :cvv, :cvc
  ```

**Current gaps:**
- No structured logging (JSON format)
- No request-level logging middleware
- No correlation IDs for request tracing

### Mobile Apps
- No logging framework configured

## Comments

### Backend (Ruby)
- Minimal comments — code is self-documenting
- Rails generator boilerplate comments preserved (e.g., fixture file headers)
- No RDoc/YARD documentation on methods
- TODO/FIXME: None found in codebase

### Mobile Apps (Kotlin)
- No KDoc documentation
- No comments beyond generated boilerplate

## Function Design

### Backend (Ruby)

**Controller Actions:**
- Single responsibility per action — one action does one thing
- Private helper methods for repeated logic (`user_json`, `register_params`)
- Strong parameters via `params.permit(...)` for input filtering

**Models:**
- Thin models with validations and associations
- Business logic methods on the model (e.g., `Student#radar_data`)
- Named parameters with defaults for optional args:
  ```ruby
  def radar_data(start_date: nil, end_date: nil)
  ```

**Services:**
- Class methods (`self.encode`, `self.decode`) — no instance state
- Constants for configuration (`SECRET_KEY`, `ALGORITHM`)

## Module Design

### Backend (Ruby)

**Concerns:**
- Use `ActiveSupport::Concern` with `extend`
- All methods in `private` block
- Used via `include` (presumably — `before_action :authenticate_user!` references it)

**API Versioning:**
- Namespaced under `Api::V1` module hierarchy
- Directory: `backend/app/controllers/api/v1/`

**Exports/Barrel files:**
- Not applicable — Rails autoloading handles this

### Mobile Apps (Kotlin)

**Source Sets:**
- `commonMain` — shared business logic and UI
- `androidMain` — Android platform specifics
- `iosMain` — iOS platform specifics

**Dependency Injection:**
- Koin configured (dependency declared) but not yet implemented in code

## Configuration Management

**Backend:**
- Rails credentials for secrets (`Rails.application.credentials.secret_key_base`)
- Fallback to ENV vars: `ENV.fetch("SECRET_KEY_BASE", "dev-secret-key")`
- API-only mode: `config.api_only = true` in `backend/config/application.rb`
- Autoload lib with ignores: `config.autoload_lib(ignore: %w[assets tasks])`

**Mobile:**
- Gradle version catalog: `gradle/libs.versions.toml` for centralized dependency versions
- Gradle properties for JVM/Android config: `gradle.properties`

---

*Convention analysis: 2026-03-04*
