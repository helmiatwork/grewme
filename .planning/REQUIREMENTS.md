# GrewMe — Requirements

## Requirement Format

Each requirement has:
- **ID:** `{CATEGORY}-{NN}` (e.g., SEC-01)
- **Priority:** v1 (must ship) or v2 (deferred)
- **Description:** What the user/system can do

---

## Security (SEC)

| ID | Priority | Description |
|----|----------|-------------|
| SEC-01 | v1 | JWT secret is sourced exclusively from Rails credentials — no fallback, no ENV default |
| SEC-02 | v1 | Registration endpoint does not accept role parameter from user input — role assigned server-side |
| SEC-03 | v1 | ApplicationController includes Authenticatable concern — all protected endpoints require valid JWT |
| SEC-04 | v1 | Refresh token rotation — database-backed, single-use, expires in 7 days |
| SEC-05 | v1 | Rate limiting via Rack::Attack — login (5/min), registration (3/min), API (60/min) |
| SEC-06 | v1 | SSL enforced via `force_ssl` and `assume_ssl` in production |
| SEC-07 | v1 | Host authorization configured for production domain |
| SEC-08 | v1 | Password minimum 8 characters with complexity requirement |
| SEC-09 | v1 | Base controller has `rescue_from` error handling (404, 422, 500 return JSON) |
| SEC-10 | v1 | CORS configured to allow mobile app origins |

## Authorization (AUTHZ)

| ID | Priority | Description |
|----|----------|-------------|
| AUTHZ-01 | v1 | Pundit policies enforce role-based access — teachers see own classrooms, parents see own children |
| AUTHZ-02 | v1 | Teacher can only access classrooms assigned to them |
| AUTHZ-03 | v1 | Parent can only access students linked via parent_students |
| AUTHZ-04 | v1 | Admin role exists but admin endpoints are deferred to v2 |
| AUTHZ-05 | v1 | Unauthorized access returns 403 with JSON error |

## API Endpoints (API)

| ID | Priority | Description |
|----|----------|-------------|
| API-01 | v1 | `POST /api/v1/auth/login` — authenticate with email/password, returns JWT + user |
| API-02 | v1 | `POST /api/v1/auth/register` — create account (teacher-only for now, parents via invitation) |
| API-03 | v1 | `POST /api/v1/auth/refresh` — exchange refresh token for new access + refresh tokens |
| API-04 | v1 | `GET /api/v1/classrooms` — list teacher's classrooms |
| API-05 | v1 | `GET /api/v1/classrooms/:id/students` — list students in a classroom |
| API-06 | v1 | `POST /api/v1/daily_scores` — submit daily scores (batch: 5 skills per student) |
| API-07 | v1 | `PUT /api/v1/daily_scores/:id` — update an existing score |
| API-08 | v1 | `GET /api/v1/students/:id/radar` — radar chart data (current averages per skill) |
| API-09 | v1 | `GET /api/v1/students/:id/daily_scores` — score history for a student |
| API-10 | v1 | `GET /api/v1/classrooms/:id/overview` — all students' radar data in a classroom |
| API-11 | v1 | `GET /api/v1/parents/children` — list parent's linked children |
| API-12 | v1 | `GET /api/v1/students/:id/progress` — trend data (weekly/monthly averages) |

## Serialization (SER)

| ID | Priority | Description |
|----|----------|-------------|
| SER-01 | v1 | Alba serializers for all API resources (user, classroom, student, daily_score, radar data) |
| SER-02 | v1 | Radar data serialized with 5 skill axes and score values |
| SER-03 | v1 | Progress data serialized with period labels and per-skill averages |

## Data & Performance (DATA)

| ID | Priority | Description |
|----|----------|-------------|
| DATA-01 | v1 | Scenic materialized view for radar chart aggregation (avg score per skill per student) |
| DATA-02 | v1 | Materialized view refreshed after score submission (debounced via Solid Queue job) |
| DATA-03 | v1 | Solid Cache for radar endpoints (10-min TTL, invalidated on score change) |
| DATA-04 | v1 | Seed data: 1 school, 2 classrooms, 2 teachers, 10 students, 3 parents, 30 days of scores |
| DATA-05 | v1 | strong_migrations gem prevents unsafe migrations |

## Testing (TEST)

| ID | Priority | Description |
|----|----------|-------------|
| TEST-01 | v1 | Model tests for all 6 models (validations, associations, scopes) |
| TEST-02 | v1 | Controller tests for all API endpoints (happy path + error cases) |
| TEST-03 | v1 | Auth tests: login, register, refresh, invalid credentials, expired tokens |
| TEST-04 | v1 | Authorization tests: teacher can't see other teacher's classrooms, parent can't see other children |
| TEST-05 | v1 | Fixtures are valid and referentially consistent (no MyString placeholders) |
| TEST-06 | v1 | SimpleCov integrated — coverage reported in CI, minimum 50% enforced |

## KMP Mobile Foundation (KMP)

| ID | Priority | Description |
|----|----------|-------------|
| KMP-01 | v1 | Monorepo: single settings.gradle.kts with 3 modules (shared, app-teacher, app-parent) |
| KMP-02 | v1 | Shared Ktor HttpClient with Auth plugin (bearer token auto-refresh on 401) |
| KMP-03 | v1 | Shared expect/actual TokenStorage (EncryptedSharedPrefs on Android) |
| KMP-04 | v1 | Shared Koin DI modules (platform, network, repository, auth) |
| KMP-05 | v1 | Shared Material3 theme (GrewMeTheme) |
| KMP-06 | v1 | Serializable navigation routes (type-safe) |
| KMP-07 | v1 | Auth state machine (Loading → Authenticated/Unauthenticated) |
| KMP-08 | v1 | Login screen (shared composable, per-app navigation) |

## COPPA Compliance (COPPA)

| ID | Priority | Description |
|----|----------|-------------|
| COPPA-01 | v1 | Invitation model: school admin creates school → invites teachers → teachers invite parents |
| COPPA-02 | v1 | Email-Plus consent flow: parent receives email, confirms consent, gets access |
| COPPA-03 | v1 | Consent record stored with timestamp, method, IP, parent identity |
| COPPA-04 | v1 | Student data inaccessible to parent until consent is granted and verified |
| COPPA-05 | v1 | Open registration replaced with invitation-only access |
| COPPA-06 | v1 | Active Record Encryption for PII: student.name, user.email, consent.parent_email |
| COPPA-07 | v1 | PaperTrail audit trail for all student data modifications |
| COPPA-08 | v1 | Custom AuditLogger for student data access logging |
| COPPA-09 | v1 | Data export endpoint: `GET /api/v1/students/:id/records/export` |
| COPPA-10 | v1 | Account deletion endpoint: `DELETE /api/v1/account` with 30-day grace period |
| COPPA-11 | v1 | Data retention cleanup job via Solid Queue |
| COPPA-12 | v1 | Privacy policy web page hosted at grewme.app/privacy |

## Teacher App Features (TEACH)

| ID | Priority | Description |
|----|----------|-------------|
| TEACH-01 | v1 | Dashboard screen: list of teacher's classrooms with student counts |
| TEACH-02 | v1 | Student list screen: students in selected classroom |
| TEACH-03 | v1 | Daily score input screen: 5 sliders (one per skill), submit all at once |
| TEACH-04 | v1 | Student detail screen: radar chart + score history |
| TEACH-05 | v1 | Class overview screen: all students' radar charts side by side |
| TEACH-06 | v1 | Navigation: Login → Classrooms → Students → Score Input / Detail |

## Parent App Features (PARENT)

| ID | Priority | Description |
|----|----------|-------------|
| PARENT-01 | v1 | Dashboard screen: list of parent's children |
| PARENT-02 | v1 | Child progress screen: radar chart (current snapshot) |
| PARENT-03 | v1 | Trend view: weekly/monthly progress lines per skill |
| PARENT-04 | v1 | Daily score history: list of daily scores with dates |
| PARENT-05 | v1 | Child switching: parent can switch between multiple children |
| PARENT-06 | v1 | Navigation: Login → Children → Child Detail (Radar/Progress/History) |

## Radar Chart (RADAR)

| ID | Priority | Description |
|----|----------|-------------|
| RADAR-01 | v1 | Custom Compose Canvas radar chart with 5 axes (Reading, Math, Writing, Logic, Social) |
| RADAR-02 | v1 | Radar chart renders scores as filled polygon on 5-point star grid |
| RADAR-03 | v1 | Animated transitions when data changes |
| RADAR-04 | v1 | Axis labels positioned correctly around chart |
| RADAR-05 | v1 | Shared composable: used in both teacher and parent apps |

## DevOps & Infrastructure (OPS)

| ID | Priority | Description |
|----|----------|-------------|
| OPS-01 | v1 | Production deploy.yml for Kamal 2 (real server, registry, accessories) |
| OPS-02 | v1 | GitHub Actions: Rails CI (Postgres service, Minitest, SimpleCov, Brakeman) |
| OPS-03 | v1 | GitHub Actions: Mobile CI (KMP build, lint, test — Android only) |
| OPS-04 | v1 | Sentry error tracking (backend + mobile) |
| OPS-05 | v1 | Lograge structured logging |
| OPS-06 | v1 | Database backup automation (daily pg_dump + off-site sync) |
| OPS-07 | v1 | Health check endpoint (DB + queue status) |
| OPS-08 | v1 | Fastlane setup for Google Play Internal Testing |
| OPS-09 | v1 | Staging seed data (Faker-based) |

## Deferred (v2)

| ID | Priority | Description |
|----|----------|-------------|
| V2-01 | v2 | Offline support via Room KMP (cache-first reading, optimistic score submission) |
| V2-02 | v2 | Real-time updates via Solid Cable/WebSockets |
| V2-03 | v2 | MLBB-style radar enhancements (gradient fill, glow effect, comparison overlay) |
| V2-04 | v2 | GDPR readiness (DPIA, EU hosting, DPO) |
| V2-05 | v2 | iOS builds and TestFlight distribution |
| V2-06 | v2 | Admin web panel (school management, bulk import) |
| V2-07 | v2 | Annual consent renewal reminders |
| V2-08 | v2 | Key rotation process |
| V2-09 | v2 | Breach notification workflow |
| V2-10 | v2 | Touch interaction on radar chart |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 1 | Pending |
| SEC-04 | Phase 1 | Pending |
| SEC-05 | Phase 1 | Pending |
| SEC-06 | Phase 1 | Pending |
| SEC-07 | Phase 1 | Pending |
| SEC-08 | Phase 1 | Pending |
| SEC-09 | Phase 1 | Pending |
| SEC-10 | Phase 1 | Pending |
| AUTHZ-01 | Phase 1 | Pending |
| AUTHZ-02 | Phase 1 | Pending |
| AUTHZ-03 | Phase 1 | Pending |
| AUTHZ-04 | Phase 1 | Pending |
| AUTHZ-05 | Phase 1 | Pending |
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Pending |
| API-03 | Phase 1 | Pending |
| API-04 | Phase 1 | Pending |
| API-05 | Phase 1 | Pending |
| API-06 | Phase 1 | Pending |
| API-07 | Phase 1 | Pending |
| API-08 | Phase 1 | Pending |
| API-09 | Phase 1 | Pending |
| API-10 | Phase 1 | Pending |
| API-11 | Phase 1 | Pending |
| API-12 | Phase 1 | Pending |
| SER-01 | Phase 1 | Pending |
| SER-02 | Phase 1 | Pending |
| SER-03 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| DATA-05 | Phase 1 | Pending |
| TEST-01 | Phase 1 | Pending |
| TEST-02 | Phase 1 | Pending |
| TEST-03 | Phase 1 | Pending |
| TEST-04 | Phase 1 | Pending |
| TEST-05 | Phase 1 | Pending |
| TEST-06 | Phase 1 | Pending |
| KMP-01 | Phase 2 | Pending |
| KMP-02 | Phase 2 | Pending |
| KMP-03 | Phase 2 | Pending |
| KMP-04 | Phase 2 | Pending |
| KMP-05 | Phase 2 | Pending |
| KMP-06 | Phase 2 | Pending |
| KMP-07 | Phase 2 | Pending |
| KMP-08 | Phase 2 | Pending |
| COPPA-01 | Phase 3 | Pending |
| COPPA-02 | Phase 3 | Pending |
| COPPA-03 | Phase 3 | Pending |
| COPPA-04 | Phase 3 | Pending |
| COPPA-05 | Phase 3 | Pending |
| COPPA-06 | Phase 3 | Pending |
| COPPA-07 | Phase 3 | Pending |
| COPPA-08 | Phase 3 | Pending |
| COPPA-09 | Phase 3 | Pending |
| COPPA-10 | Phase 3 | Pending |
| COPPA-11 | Phase 3 | Pending |
| COPPA-12 | Phase 3 | Pending |
| RADAR-01 | Phase 4 | Pending |
| RADAR-02 | Phase 4 | Pending |
| RADAR-03 | Phase 4 | Pending |
| RADAR-04 | Phase 4 | Pending |
| RADAR-05 | Phase 4 | Pending |
| TEACH-01 | Phase 4 | Pending |
| TEACH-02 | Phase 4 | Pending |
| TEACH-03 | Phase 4 | Pending |
| TEACH-04 | Phase 4 | Pending |
| TEACH-05 | Phase 4 | Pending |
| TEACH-06 | Phase 4 | Pending |
| PARENT-01 | Phase 4 | Pending |
| PARENT-02 | Phase 4 | Pending |
| PARENT-03 | Phase 4 | Pending |
| PARENT-04 | Phase 4 | Pending |
| PARENT-05 | Phase 4 | Pending |
| PARENT-06 | Phase 4 | Pending |
| OPS-01 | Phase 5 | Pending |
| OPS-02 | Phase 5 | Pending |
| OPS-03 | Phase 5 | Pending |
| OPS-04 | Phase 5 | Pending |
| OPS-05 | Phase 5 | Pending |
| OPS-06 | Phase 5 | Pending |
| OPS-07 | Phase 5 | Pending |
| OPS-08 | Phase 5 | Pending |
| OPS-09 | Phase 5 | Pending |
