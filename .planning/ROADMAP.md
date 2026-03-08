# GrewMe — Roadmap

## Phases

- [ ] **Phase 1: Security Foundation & Backend Core** — Fix critical vulnerabilities, wire all API endpoints, add authorization, serialization, caching, and tests
- [ ] **Phase 2: KMP Monorepo & Mobile Foundation** — Consolidate two Gradle projects into monorepo, build shared networking/auth/DI/theme layers
- [ ] **Phase 3: Compliance & Consent Engine** — COPPA invitation flow, parental consent, audit logging, PII encryption, data export/deletion
- [ ] **Phase 4: Radar Chart & Core Mobile Features** — Build the actual product: teacher score entry, parent radar viewing, custom radar chart component
- [ ] **Phase 5: DevOps, CI/CD & Quality** — Production deployment, mobile CI, error tracking, logging, backups, app store distribution
- [ ] **Phase 6: Polish & Advanced Features** — Offline support, real-time updates, MLBB visual enhancements, GDPR readiness, iOS

---

## Phase Details

### Phase 1: Security Foundation & Backend Core

**Goal:** A secure, fully functional Rails API that any client can authenticate with, query data from, and receive properly serialized responses — with tests proving it works.

**Depends on:** Nothing (first phase — fixes broken foundation)

**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08, SEC-09, SEC-10, AUTHZ-01, AUTHZ-02, AUTHZ-03, AUTHZ-04, AUTHZ-05, API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10, API-11, API-12, SER-01, SER-02, SER-03, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06

**Success Criteria** (what must be TRUE when this phase completes):

1. **Auth is airtight:** A user can register (without choosing their own role), log in, receive a JWT, refresh it, and hit protected endpoints — and none of this works with a forged token or expired token.
2. **Every designed endpoint responds:** All 12 API endpoints from the design doc return correct JSON (Alba-serialized) for valid requests and proper error JSON for invalid ones.
3. **Authorization is enforced:** A teacher cannot see another teacher's classrooms. A parent cannot see children not linked to them. Attempting either returns 403.
4. **Radar data is fast:** The `/students/:id/radar` endpoint returns aggregated scores from a materialized view, cached with 10-min TTL, and the cache invalidates when new scores are submitted.
5. **Tests prove it:** Minitest suite passes with ≥50% code coverage (SimpleCov), covering all models, all endpoints (happy + error paths), auth flows, and authorization boundaries.

**Plans:** 9 plans

Plans:
- [ ] 01-01-PLAN.md — Critical security fixes (JWT secret, role escalation, auth chain, password complexity)
- [ ] 01-02-PLAN.md — Test infrastructure (fixtures, SimpleCov, auth test helpers)
- [ ] 01-03-PLAN.md — Routes, base controller, error handling, CORS, SSL, rate limiting
- [ ] 01-04-PLAN.md — Model tests for all 6 models
- [ ] 01-05-PLAN.md — Refresh token rotation + JTI revocation
- [ ] 01-06-PLAN.md — Pundit authorization policies + Alba serializers
- [ ] 01-07-PLAN.md — Read API controllers (classrooms, students, parents)
- [ ] 01-08-PLAN.md — Score API + materialized views + caching + seeds
- [ ] 01-09-PLAN.md — Controller & auth integration tests + coverage enforcement

---

### Phase 2: KMP Monorepo & Mobile Foundation

**Goal:** A single Kotlin Multiplatform project where both apps compile, share networking/auth/DI/theme code, and can authenticate against the Phase 1 backend.

**Depends on:** Phase 1 (needs working auth endpoints to test against)

**Requirements:** KMP-01, KMP-02, KMP-03, KMP-04, KMP-05, KMP-06, KMP-07, KMP-08

**Success Criteria** (what must be TRUE when this phase completes):

1. **Single build:** Running `./gradlew build` from the repo root compiles the shared module, teacher app, and parent app without errors.
2. **Shared auth works end-to-end:** A user can open either app, see a login screen, enter credentials, authenticate against the backend, and be routed to the appropriate home screen — with the token stored securely in EncryptedSharedPreferences.
3. **Token lifecycle is automatic:** If the access token expires, the Ktor Auth plugin silently refreshes it using the stored refresh token — the user never sees an auth error during normal use.
4. **Consistent look:** Both apps use the shared GrewMeTheme (Material3 colors, typography) — they look like the same product family.

**Plans:** TBD

---

### Phase 3: Compliance & Consent Engine

**Goal:** The invitation-based access model is enforced, parental consent is collected before any child data is visible, and all COPPA-required data protections are in place.

**Depends on:** Phase 1 (API foundation), Phase 2 (mobile auth — needed for testing consent flow on device)

**Requirements:** COPPA-01, COPPA-02, COPPA-03, COPPA-04, COPPA-05, COPPA-06, COPPA-07, COPPA-08, COPPA-09, COPPA-10, COPPA-11, COPPA-12

**Success Criteria** (what must be TRUE when this phase completes):

1. **Invitation chain works:** A school admin creates a school, invites a teacher (who receives an email), the teacher accepts and can then invite a parent (who receives a consent email) — no one can register without an invitation.
2. **Consent gates data:** A parent who has been invited but has NOT completed the Email-Plus consent flow cannot see any child data. After completing consent, child data becomes visible immediately.
3. **PII is encrypted at rest:** Student names, user emails, and consent records are encrypted in the database using Active Record Encryption — a raw database dump reveals no readable PII.
4. **Audit trail is complete:** Every access to student data and every modification is logged (PaperTrail for modifications, AuditLogger for reads) — an admin can reconstruct who saw what and when.
5. **Parents can exercise rights:** A parent can export all their child's data as a download, and can delete their account (with 30-day grace period) — both from the API.

**Plans:** TBD

---

### Phase 4: Radar Chart & Core Mobile Features

**Goal:** Teachers can input daily scores from their phone and immediately see the radar chart update. Parents can open their app and see their child's radar chart, progress trends, and score history.

**Depends on:** Phase 2 (mobile foundation), Phase 3 (consent — needed so parent flow works with consent gate)

**Requirements:** RADAR-01, RADAR-02, RADAR-03, RADAR-04, RADAR-05, TEACH-01, TEACH-02, TEACH-03, TEACH-04, TEACH-05, TEACH-06, PARENT-01, PARENT-02, PARENT-03, PARENT-04, PARENT-05, PARENT-06

**Success Criteria** (what must be TRUE when this phase completes):

1. **Teacher full flow:** A teacher opens the app → selects classroom → selects student → inputs 5 skill scores via sliders → submits → sees the radar chart update on the student detail screen.
2. **Parent full flow:** A consented parent opens the app → sees list of children → taps a child → sees a radar chart showing current skill averages, can view weekly/monthly trends, and can browse daily score history.
3. **Radar chart looks right:** The custom Compose Canvas radar chart renders a 5-axis polygon grid, plots scores as a filled shape, positions axis labels correctly, and animates smoothly when data changes.
4. **Radar chart is shared code:** The same RadarChart composable renders in both teacher and parent apps from the shared KMP module — not duplicated.
5. **Class overview works:** A teacher can see all students' radar charts side by side on the class overview screen, giving a quick visual comparison.

**Plans:** TBD

---

### Phase 5: DevOps, CI/CD & Quality

**Goal:** The app can be deployed to production with one command, CI catches regressions automatically, errors are tracked in real-time, and the app is distributed to testers via Google Play Internal Testing.

**Depends on:** Phase 1 (backend to deploy), Phase 4 (mobile apps to distribute)

**Requirements:** OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06, OPS-07, OPS-08, OPS-09

**Success Criteria** (what must be TRUE when this phase completes):

1. **One-command deploy:** Running `kamal deploy` pushes the Rails app to production with SSL, connects to PostgreSQL, and the health check passes — the API is live and serving requests.
2. **CI catches failures:** A PR that breaks tests, drops below coverage threshold, or introduces a Brakeman warning is blocked from merging — both Rails and KMP pipelines run on every push.
3. **Errors are visible:** When an unhandled exception occurs in production (backend or mobile), it appears in Sentry within 60 seconds with full stack trace and request context.
4. **App is distributed:** An APK is uploaded to Google Play Internal Testing via Fastlane — testers can install the teacher and parent apps from the Play Store.
5. **Data is backed up:** PostgreSQL is backed up daily via pg_dump, synced off-site, and a restore has been tested at least once.

**Plans:** TBD

---

### Phase 6: Polish & Advanced Features

**Goal:** The app feels polished and production-ready — offline support, real-time updates, MLBB-style visual enhancements, and groundwork for future iOS and EU expansion.

**Depends on:** Phase 4 (features to polish), Phase 5 (production infrastructure)

**Requirements:** V2-01, V2-02, V2-03, V2-04, V2-05, V2-06, V2-07, V2-08, V2-09, V2-10

**Note:** Phase 6 is entirely v2 scope. It's included in the roadmap for visibility but is not required for launch.

**Success Criteria** (what must be TRUE when this phase completes):

1. **Works offline:** A teacher can input scores while offline — scores queue locally in Room and sync automatically when connectivity returns, without data loss or duplicates.
2. **Real-time parent updates:** When a teacher submits scores, the parent app updates within seconds via WebSocket (Solid Cable) — no manual refresh needed.
3. **MLBB visual polish:** The radar chart has gradient fills, glow effects, and optional comparison overlays (e.g., this week vs last week) — it looks game-inspired, not clinical.
4. **iOS ready:** The teacher and parent apps compile and run on iOS, distributed via TestFlight to internal testers.

**Plans:** TBD

---

## Progress

| Phase | Status | Completed |
|-------|--------|-----------|
| 1. Security Foundation & Backend Core | **Complete** ✅ (9/9 plans) | 2026-03-04 |
| 2. KMP Monorepo & Mobile Foundation | Deferred (web-first) | - |
| 3. Compliance & Consent Engine | **Complete** ✅ (14 tasks, 9 waves) | 2026-03-08 |
| 4. Radar Chart & Core Features | **Complete** ✅ (web equivalents already built) | 2026-03-08 |
| 5. DevOps, CI/CD & Quality | **Complete** ✅ (Sentry, Lograge, Railway, Vercel) | 2026-03-08 |
| 6. Polish & Advanced Features | Not started (v2 scope) | - |

---

## Coverage Map

### Phase 1: Security Foundation & Backend Core (41 requirements)
SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08, SEC-09, SEC-10,
AUTHZ-01, AUTHZ-02, AUTHZ-03, AUTHZ-04, AUTHZ-05,
API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10, API-11, API-12,
SER-01, SER-02, SER-03,
DATA-01, DATA-02, DATA-03, DATA-04, DATA-05,
TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06

### Phase 2: KMP Monorepo & Mobile Foundation (8 requirements)
KMP-01, KMP-02, KMP-03, KMP-04, KMP-05, KMP-06, KMP-07, KMP-08

### Phase 3: Compliance & Consent Engine (12 requirements)
COPPA-01, COPPA-02, COPPA-03, COPPA-04, COPPA-05, COPPA-06, COPPA-07, COPPA-08, COPPA-09, COPPA-10, COPPA-11, COPPA-12

### Phase 4: Radar Chart & Core Mobile Features (17 requirements)
RADAR-01, RADAR-02, RADAR-03, RADAR-04, RADAR-05,
TEACH-01, TEACH-02, TEACH-03, TEACH-04, TEACH-05, TEACH-06,
PARENT-01, PARENT-02, PARENT-03, PARENT-04, PARENT-05, PARENT-06

### Phase 5: DevOps, CI/CD & Quality (9 requirements)
OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06, OPS-07, OPS-08, OPS-09

### Phase 6: Polish & Advanced Features (10 requirements — all v2)
V2-01, V2-02, V2-03, V2-04, V2-05, V2-06, V2-07, V2-08, V2-09, V2-10

**Total v1 requirements: 87 mapped / 87 total ✓**
**Total v2 requirements: 10 mapped / 10 total ✓**
**Orphaned requirements: 0 ✓**
