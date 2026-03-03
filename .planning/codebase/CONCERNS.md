# Codebase Concerns

**Analysis Date:** 2026-03-04

## Tech Debt

**Hardcoded Fallback JWT Secret:**
- Issue: `JwtService` falls back to `"dev-secret-key"` when both `Rails.application.credentials.secret_key_base` and `SECRET_KEY_BASE` env var are missing. This is a static, guessable string that could be used in production if credentials are misconfigured.
- Files: `backend/app/services/jwt_service.rb` (line 2)
- Impact: If deployed without proper credentials configuration, all JWTs are signed with `"dev-secret-key"`, allowing trivial token forgery and full account takeover.
- Fix approach: Remove the hardcoded fallback. Raise an error on boot if `secret_key_base` is not available: `SECRET_KEY = Rails.application.credentials.secret_key_base || ENV.fetch("SECRET_KEY_BASE") { raise "SECRET_KEY_BASE must be set" }`.

**No API Routes Defined:**
- Issue: `config/routes.rb` only defines the health check route. The `AuthController` defines `skip_before_action :authenticate_user!` but `ApplicationController` has no `before_action :authenticate_user!`. Routes for auth and all other endpoints from the design doc are missing.
- Files: `backend/config/routes.rb`, `backend/app/controllers/application_controller.rb`
- Impact: The API is non-functional — no endpoints are reachable. The `before_action` chain in `AuthController` will error because `authenticate_user!` is not registered as a before_action on the base controller.
- Fix approach: Add API routes under `namespace :api { namespace :v1 { ... } }`. Add `include Authenticatable` and `before_action :authenticate_user!` to `ApplicationController` (or a base API controller).

**CORS Not Configured:**
- Issue: The CORS initializer is entirely commented out. Mobile apps making HTTP requests to the backend from different origins will be blocked by the browser (relevant for any web-based testing) and potentially by iOS App Transport Security.
- Files: `backend/config/initializers/cors.rb`
- Impact: Cross-origin requests fail. While native mobile apps don't enforce CORS the same way browsers do, this blocks any web-based tooling and testing.
- Fix approach: Uncomment and configure `Rack::Cors` with appropriate allowed origins for the mobile apps' needs.

**Empty Test Files (Zero Test Coverage):**
- Issue: All 6 model test files contain only scaffold boilerplate — every test is commented out. No controller tests exist. No integration tests exist. The CI pipeline runs `bin/rails test` which executes nothing.
- Files: `backend/test/models/user_test.rb`, `backend/test/models/student_test.rb`, `backend/test/models/classroom_test.rb`, `backend/test/models/school_test.rb`, `backend/test/models/daily_score_test.rb`, `backend/test/models/parent_student_test.rb`
- Impact: No validation that any model, controller, or service code works correctly. Regressions will not be caught.
- Fix approach: Write tests for all model validations, `JwtService.encode`/`decode`, `Authenticatable` concern, and `AuthController` actions as the first priority.

**Broken Fixtures:**
- Issue: Test fixtures use `MyString` placeholder values and duplicate emails (`email: MyString` for both user fixtures), which violates the unique email constraint. Fixtures will fail to load if tests are run.
- Files: `backend/test/fixtures/users.yml`, `backend/test/fixtures/students.yml`, `backend/test/fixtures/classrooms.yml`, `backend/test/fixtures/schools.yml`, `backend/test/fixtures/daily_scores.yml`, `backend/test/fixtures/parent_students.yml`
- Impact: Running tests will fail with database constraint violations before any assertions execute.
- Fix approach: Replace all `MyString` placeholders with valid, unique values. Use `has_secure_password`-compatible `password_digest` values (e.g., `BCrypt::Password.create("password")`).

**Missing Most API Controllers:**
- Issue: Only `AuthController` exists. The design document specifies 10+ endpoints for classrooms, students, daily_scores, parents, and radar data. None of these controllers exist.
- Files: `backend/app/controllers/api/v1/` (only `auth_controller.rb` present)
- Impact: The app cannot perform its core function — teacher scoring, parent viewing, radar chart data retrieval.
- Fix approach: Implement controllers for all design doc endpoints: `ClassroomsController`, `StudentsController`, `DailyScoresController`, `ParentsController`, and radar/progress endpoints.

**Missing `shared/` Modules in Mobile Apps:**
- Issue: The design doc specifies `shared/` directories for both KMP apps containing shared Kotlin code (networking, models, business logic). These directories do not exist. All code is in `composeApp/` only.
- Files: `mobile-app-teacher/`, `mobile-app-parent/` (no `shared/` directory in either)
- Impact: When building out mobile apps, there's no shared module for API clients, data models, or business logic — leading to duplication between teacher and parent apps.
- Fix approach: Create shared KMP modules or consider a shared library project that both apps depend on.

**Mobile Apps Are Placeholder Only:**
- Issue: Both mobile apps display only "Coming soon..." text. No navigation, no API integration, no screens, no authentication flow.
- Files: `mobile-app-teacher/composeApp/src/commonMain/kotlin/com/grewme/teacher/App.kt`, `mobile-app-parent/composeApp/src/commonMain/kotlin/com/grewme/parent/App.kt`
- Impact: No mobile functionality exists — the entire user-facing product is unbuilt.
- Fix approach: Implement according to the design doc, starting with login screen, API client setup (Ktor + kotlinx.serialization), and navigation.

**Empty Seeds File:**
- Issue: `db/seeds.rb` contains only the Rails boilerplate comment. No seed data for development or testing.
- Files: `backend/db/seeds.rb`
- Impact: Developers must manually create schools, users, classrooms, students, and scores to test anything. Slows development significantly.
- Fix approach: Add seed data for at least: 1 school, 1 teacher, 1 parent, 1 classroom, 3-5 students, sample daily_scores across all skill categories.

**Missing Serializers:**
- Issue: The design doc lists `app/serializers/` in the project structure, but no serializers directory or files exist. The `AuthController` uses inline JSON construction.
- Files: `backend/app/controllers/api/v1/auth_controller.rb` (lines 40-47, `user_json` method)
- Impact: As more endpoints are built, JSON response construction will be scattered across controllers with no consistent pattern.
- Fix approach: Adopt a serialization approach — either `ActiveModel::Serializers`, `jsonapi-serializer`, or Rails' built-in Jbuilder (already in Gemfile but commented out).

**No Token Refresh Mechanism:**
- Issue: The design doc specifies `POST /api/v1/auth/refresh` but no refresh token implementation exists. JWTs expire in 24 hours with no way to renew.
- Files: `backend/app/services/jwt_service.rb`, `backend/app/controllers/api/v1/auth_controller.rb`
- Impact: Users must re-authenticate (re-enter email/password) every 24 hours.
- Fix approach: Implement refresh tokens — either as a separate long-lived token stored server-side, or as JWT rotation with a sliding window.

**`skill_summaries` Materialized View Not Implemented:**
- Issue: The design doc specifies a `skill_summaries` table/materialized view for cached averages (weekly/monthly/all_time). This doesn't exist. The `Student#radar_data` method computes averages on every request.
- Files: `backend/app/models/student.rb` (lines 10-15), `backend/db/schema.rb`
- Impact: As daily_scores grow, computing averages on every request will degrade performance.
- Fix approach: Implement as a PostgreSQL materialized view or a cached table with a background job refresh (SolidQueue is already configured).

## Known Bugs

**`ApplicationController` Missing Authentication Hook:**
- Symptoms: `AuthController` calls `skip_before_action :authenticate_user!` (line 4), but `ApplicationController` does not include `Authenticatable` or define `before_action :authenticate_user!`. This will raise `AbstractController::ActionNotFound` at runtime.
- Files: `backend/app/controllers/application_controller.rb` (line 1-2), `backend/app/controllers/api/v1/auth_controller.rb` (line 4)
- Trigger: Any request to the auth endpoints.
- Workaround: Add `include Authenticatable` and `before_action :authenticate_user!` to `ApplicationController`.

**Role Escalation via Registration:**
- Symptoms: The `register` endpoint permits the `role` parameter directly from user input. Anyone can register as `:admin` (role: 2) by including `role: "admin"` in the request body.
- Files: `backend/app/controllers/api/v1/auth_controller.rb` (line 37: `params.permit(:name, :email, :password, :password_confirmation, :role)`)
- Trigger: `POST /api/v1/auth/register` with `{ role: "admin" }` in the request body.
- Workaround: Remove `:role` from `register_params` and either default to a safe role or require admin invitation for privileged roles.

## Security Considerations

**Children's Data Privacy (COPPA/GDPR-K Compliance):**
- Risk: This app handles educational data for children ages 5-7. Under COPPA (Children's Online Privacy Protection Act), FERPA (Family Educational Rights and Privacy Act), and GDPR Article 8, there are strict requirements around children's data that are not addressed.
- Files: Entire codebase — no privacy controls implemented
- Current mitigation: None
- Recommendations:
  - Implement parental consent workflow before any child data is stored
  - Add data retention policies — auto-delete old scores after a configurable period
  - Add data export endpoint for parents (right to access)
  - Add data deletion endpoint for parents (right to erasure)
  - Add a privacy policy endpoint or document
  - Consider encryption at rest for student PII (names, scores)
  - Ensure the `students` table `name` field is not the child's full legal name, or encrypt it
  - Add audit logging for all access to student data
  - Never expose student data to users who are not the student's teacher or parent

**No Rate Limiting:**
- Risk: No rate limiting on any endpoint, especially the login endpoint. Vulnerable to brute-force password attacks.
- Files: No rate limiting middleware configured anywhere
- Current mitigation: None
- Recommendations: Add `Rack::Attack` gem with rate limiting on `/api/v1/auth/login` (max 5 attempts per IP per minute), registration (max 3 per IP per hour), and general API endpoints.

**SSL/TLS Not Enforced:**
- Risk: `config.force_ssl` and `config.assume_ssl` are both commented out in production config. All traffic including JWT tokens and passwords could travel unencrypted.
- Files: `backend/config/environments/production.rb` (lines 25-28)
- Current mitigation: Deployment via Kamal with Thruster may handle this at the proxy level, but it's not guaranteed.
- Recommendations: Uncomment `config.assume_ssl = true` and `config.force_ssl = true`. Configure the SSL proxy in `config/deploy.yml`.

**No Password Strength Requirements:**
- Risk: No minimum password length or complexity validation. Users can register with a 1-character password.
- Files: `backend/app/models/user.rb` — `has_secure_password` only validates presence, not strength
- Current mitigation: `has_secure_password` validates presence and confirmation, nothing else.
- Recommendations: Add `validates :password, length: { minimum: 8 }` to the User model. Consider adding complexity requirements.

**JWT Contains Role — No Server-Side Verification:**
- Risk: The JWT payload includes `role` (line 10 of auth_controller). While the token is signed, if a user's role changes (e.g., admin revokes teacher access), the old JWT still contains the old role until expiry.
- Files: `backend/app/services/jwt_service.rb`, `backend/app/controllers/api/v1/auth_controller.rb` (line 10), `backend/app/controllers/concerns/authenticatable.rb` (line 15)
- Current mitigation: `Authenticatable` fetches the user from DB on every request (line 15), but `authorize_role!` uses `current_user.role` from DB, which is correct. However, the role in the JWT is unused after decoding — it's misleading.
- Recommendations: Remove `role` from the JWT payload to avoid confusion. Always rely on `current_user.role` from the database lookup.

**No Authorization Scoping (Data Leakage Risk):**
- Risk: No multi-tenancy scoping exists. When student/classroom endpoints are built, there's no mechanism to ensure teachers only see their classrooms and parents only see their children. A parent could potentially access any student's data.
- Files: `backend/app/controllers/concerns/authenticatable.rb` (only has role check, no resource scoping)
- Current mitigation: None — endpoints don't exist yet, but the pattern must be established.
- Recommendations: Add resource-scoping methods like `current_user.classrooms` for teachers, `current_user.children` for parents. Use `before_action` callbacks to scope all queries.

**`android:allowBackup="true"` on Mobile Apps:**
- Risk: Both Android manifests enable backup, which could allow extraction of locally stored JWT tokens or cached data from the device.
- Files: `mobile-app-teacher/composeApp/src/androidMain/AndroidManifest.xml` (line 5), `mobile-app-parent/composeApp/src/androidMain/AndroidManifest.xml` (line 5)
- Current mitigation: None
- Recommendations: Set `android:allowBackup="false"` or implement `android:fullBackupContent` with explicit exclusion of sensitive data directories.

**Host Authorization Disabled:**
- Risk: `config.hosts` is commented out in production. No DNS rebinding protection.
- Files: `backend/config/environments/production.rb` (lines 79-86)
- Current mitigation: None
- Recommendations: Configure `config.hosts` with the production domain once known.

## Performance Bottlenecks

**Radar Data Computed On-the-Fly:**
- Problem: `Student#radar_data` executes a GROUP BY + AVG query on `daily_scores` for every request. No caching or pre-computation.
- Files: `backend/app/models/student.rb` (lines 10-15)
- Cause: The `skill_summaries` materialized view from the design doc is not implemented.
- Improvement path: Implement `skill_summaries` as a materialized view refreshed by SolidQueue background job, or add Rails fragment caching keyed on `student.daily_scores.maximum(:updated_at)`.

**Classroom Overview Will Be N+1:**
- Problem: The design doc specifies `GET /api/v1/classrooms/:id/overview` which returns all students' radar data in a classroom. Without eager loading and pre-computation, this will execute N queries (one per student).
- Files: Not yet implemented, but the pattern in `backend/app/models/student.rb` (`radar_data` method) requires a per-student query.
- Cause: No batch computation of radar data across students.
- Improvement path: Build a single query that computes averages for all students in a classroom at once, or use the `skill_summaries` approach.

**No Database Connection Pooling Configuration:**
- Problem: Default thread pool is 5 (`max_connections: 5` in `database.yml`), which may be too low for production with Puma workers.
- Files: `backend/config/database.yml` (line 20)
- Cause: Default Rails scaffold value.
- Improvement path: Set `max_connections` to match `RAILS_MAX_THREADS * WEB_CONCURRENCY` in production.

## Fragile Areas

**Authentication Concern:**
- Files: `backend/app/controllers/concerns/authenticatable.rb`, `backend/app/services/jwt_service.rb`
- Why fragile: The auth chain depends on `JwtService.decode` returning `nil` for all error cases, but only catches `JWT::DecodeError` and `JWT::ExpiredSignature`. Other JWT exceptions (e.g., `JWT::InvalidIssuerError`, `JWT::InvalidAudError` if claims are added later) will propagate as 500 errors.
- Safe modification: Add a catch-all `rescue JWT::DecodeError => e` (which is the base class for most JWT errors) or `rescue StandardError => e` with logging.
- Test coverage: Zero — no tests exist for the auth flow.

**User-Student-Classroom Authorization Chain:**
- Files: `backend/app/models/user.rb`, `backend/app/models/classroom.rb`, `backend/app/models/student.rb`, `backend/app/models/parent_student.rb`
- Why fragile: The relationship chain `User(teacher) -> Classroom -> Student` and `User(parent) -> ParentStudent -> Student` defines the authorization boundary. Any new endpoint that doesn't properly scope through these relationships will leak data.
- Safe modification: Build authorization into a reusable concern or policy object (e.g., Pundit) rather than scattering checks across controllers.
- Test coverage: Zero.

## Scaling Limits

**Daily Scores Table Growth:**
- Current capacity: No rows yet, but by design each student generates 5 rows per school day (one per skill_category).
- Limit: With 100 students over a school year (~200 days), that's 100,000 rows. With 1,000 students: 1,000,000 rows. The `radar_data` method does a full scan per student per request.
- Scaling path: Add the `skill_summaries` materialized view. Add a composite index on `(student_id, date)` for range queries (only `student_id` is indexed individually today). Consider partitioning by date for large deployments.

**Single Database for Everything:**
- Current capacity: Production config uses 4 separate PostgreSQL databases (primary, cache, queue, cable) — good separation.
- Limit: All on the same server if following the default Kamal config.
- Scaling path: Move SolidQueue/SolidCache/SolidCable databases to separate instances if throughput demands it.

## Dependencies at Risk

**Navigation Compose Alpha Version:**
- Risk: `navigation-compose` is pinned to `2.8.0-alpha10` — an alpha release. API may change without notice.
- Files: `mobile-app-teacher/gradle/libs.versions.toml` (line 11), `mobile-app-parent/gradle/libs.versions.toml` (same)
- Impact: Breaking changes on update, potential runtime bugs from pre-release code.
- Migration plan: Track stable releases and upgrade when `2.8.0` reaches stable. Pin to a specific alpha and don't auto-update.

**No Version Pinning on `jwt` Gem:**
- Risk: The `jwt` gem has no version constraint in the Gemfile: `gem "jwt"`. Major version bumps could introduce breaking API changes.
- Files: `backend/Gemfile` (line 39)
- Impact: `bundle update` could pull a new major version that changes `JWT.encode`/`JWT.decode` API.
- Migration plan: Pin to `gem "jwt", "~> 2.9"` (or current major version).

**Duplicate KMP Project Setup:**
- Risk: Both mobile apps have identical `build.gradle.kts`, `libs.versions.toml`, and `gradle.properties`. Version drift between them is inevitable.
- Files: `mobile-app-teacher/composeApp/build.gradle.kts`, `mobile-app-parent/composeApp/build.gradle.kts`, `mobile-app-teacher/gradle/libs.versions.toml`, `mobile-app-parent/gradle/libs.versions.toml`
- Impact: One app could end up on different dependency versions than the other, causing inconsistent behavior.
- Migration plan: Consider a shared Gradle version catalog or a root-level `libs.versions.toml` with a composite build.

## Missing Critical Features

**No Parental Consent Mechanism:**
- Problem: No mechanism for obtaining or recording parental consent before storing children's educational data.
- Blocks: Legal deployment in jurisdictions with COPPA/GDPR-K requirements (US, EU, and most countries with children's data protection laws).

**No Data Export/Deletion:**
- Problem: No endpoints for parents to export or delete their children's data.
- Blocks: GDPR compliance (right to access, right to erasure). Required for app store approval in many markets.

**No Account Deactivation:**
- Problem: No way for users to deactivate or delete their accounts.
- Blocks: App store requirements (Apple and Google both require account deletion capability).

**No Invitation/Onboarding Flow:**
- Problem: Anyone can register with any role. No mechanism for schools to invite teachers, or teachers to invite parents, or to link parents to specific students.
- Blocks: Secure multi-tenant operation — currently any registered user could (once endpoints exist) potentially access any data.

**No Audit Logging:**
- Problem: No record of who accessed, created, or modified student data. Critical for educational records compliance.
- Blocks: FERPA compliance, incident investigation capability.

## Test Coverage Gaps

**All Models — Zero Tests:**
- What's not tested: All model validations, associations, enum definitions, `Student#radar_data` method, `has_secure_password` behavior.
- Files: `backend/test/models/user_test.rb`, `backend/test/models/student_test.rb`, `backend/test/models/classroom_test.rb`, `backend/test/models/school_test.rb`, `backend/test/models/daily_score_test.rb`, `backend/test/models/parent_student_test.rb`
- Risk: Validation rules could be accidentally removed or changed without detection.
- Priority: **High** — models contain the core business rules (score range 0-100, uniqueness constraints, role enums).

**JwtService — Zero Tests:**
- What's not tested: Token encoding, decoding, expiration, invalid token handling, secret key configuration.
- Files: `backend/app/services/jwt_service.rb` (no test file exists)
- Risk: Authentication could silently break — tokens could become undecodable, expired tokens could be accepted, etc.
- Priority: **High** — authentication is the security perimeter.

**AuthController — Zero Tests:**
- What's not tested: Login success/failure, registration success/failure, parameter validation, role escalation prevention.
- Files: `backend/app/controllers/api/v1/auth_controller.rb` (no controller test exists)
- Risk: The role escalation bug (permitting `:role` in registration) would be caught by a basic security test.
- Priority: **High** — this is the only functional endpoint.

**Authenticatable Concern — Zero Tests:**
- What's not tested: Token extraction from headers, user lookup from decoded token, unauthorized response for invalid/missing tokens, role authorization.
- Files: `backend/app/controllers/concerns/authenticatable.rb` (no test exists)
- Risk: Broken auth = full data exposure.
- Priority: **High**.

**Mobile Apps — No Test Infrastructure:**
- What's not tested: Everything — apps are placeholder.
- Files: No test directories or test files exist in `mobile-app-teacher/` or `mobile-app-parent/`
- Risk: When mobile code is built, there's no test pattern established.
- Priority: **Medium** — establish test infrastructure when building first real features.

---

*Concerns audit: 2026-03-04*
