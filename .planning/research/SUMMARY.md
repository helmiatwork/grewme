# GrewMe Research Synthesis

**Synthesized:** 2026-03-04
**Research files:** rails-api-patterns.md, kmp-mobile-patterns.md, compliance-privacy.md, deployment-devops.md
**Overall confidence:** HIGH

---

## Executive Summary

GrewMe is a children's education app where teachers score students (ages 5–7) across 5 skill categories daily, and parents view MLBB-style radar charts of their children's progress. This is a **COPPA-regulated edtech product**, which fundamentally shapes every architectural and implementation decision. The research is unanimous: security and compliance cannot be bolted on later — they must be the foundation. The current codebase has two critical security vulnerabilities (hardcoded JWT fallback secret enabling token forgery, and open registration with role escalation) that must be fixed before any other work proceeds.

The recommended stack is solid and well-proven: Rails 8.1.2 API-only backend with PostgreSQL, Alba for serialization, Pundit for authorization, Rack::Attack for rate limiting, and the built-in Solid Queue/Cache/Cable trio. On mobile, Kotlin Multiplatform with Compose Multiplatform is the right call, but the current two-separate-project structure must be consolidated into a monorepo with a shared module (~70-80% code sharing). The custom radar chart built with Compose Canvas is the product's core differentiator — it should be hand-rolled, not library-dependent.

The biggest risk is **COPPA non-compliance**. The 2025 amended COPPA Rule has a compliance deadline of April 22, 2026. GrewMe stores personal information about children (names, skill scores) and requires verifiable parental consent before any data collection. This means an invitation-only access model (school → teacher → parent consent), no open registration, audit logging of all student data access, data retention policies, and encryption of PII at rest. Apple and Google both require account deletion endpoints. Missing any of these blocks app store submission and risks FTC enforcement action.

---

## Key Findings

### From Rails API Patterns (HIGH confidence)

| Technology | Rationale |
|-----------|-----------|
| **Alba** (serializer) | Fastest pure-Ruby serializer, zero dependencies, 2-3x faster than AMS |
| **Pundit** (authorization) | Plain Ruby policy objects, perfect for role + resource scoping (teacher/parent/admin × own classrooms/children) |
| **Rack::Attack** (rate limiting) | Industry standard, pairs with Solid Cache backend |
| **Scenic** (materialized views) | PostgreSQL materialized views for radar chart aggregation — refresh daily, query instantly |
| **PaperTrail** (audit trail) | Separate versions table ideal for COPPA compliance reporting |
| **Minitest + fixtures** (testing) | Already configured, faster than RSpec, Rails-idiomatic |

**Critical fixes needed now:**
1. Remove `"dev-secret-key"` JWT fallback — enables token forgery
2. Remove `:role` from `register_params` — enables admin role escalation
3. Wire routes.rb (currently empty)
4. Build refresh token rotation (database-backed)
5. Add error handling in base controller

### From KMP Mobile Patterns (HIGH confidence)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project structure | **Monorepo with shared module** | Current two-project setup duplicates everything |
| Networking | **Ktor + Auth plugin** | Built-in bearer token management, auto-refresh on 401 |
| DI | **Koin 4.0** | Already in project, excellent KMP support |
| Navigation | **Navigation Compose 2.8+** | Type-safe `@Serializable` routes |
| Token storage | **expect/actual** (EncryptedSharedPrefs / Keychain) | Small surface, no library needed |
| Radar chart | **Custom Compose Canvas** | Core differentiator, ~150 lines, fully controllable |
| Offline DB | **Room KMP 2.8+** | Cache-first with network refresh |
| Testing | **kotlin-test + Ktor MockEngine + Turbine + Fakes** | No mocking library in commonTest |

**Critical action needed now:**
- Consolidate two Gradle projects into monorepo **before** building any features
- This is disruptive — do it once, early, when codebase is placeholder-only

### From Compliance & Privacy (HIGH confidence)

**COPPA applies definitively.** GrewMe stores personal information about children under 13 (names + skill scores collected through teachers). The 2025 amended COPPA Rule (compliance deadline April 22, 2026) requires:

1. **Verifiable Parental Consent (VPC)** — Use Email-Plus method (lowest friction for teacher-mediated flow)
2. **Invitation-only access** — School → teacher invite → parent consent flow. **No open registration.**
3. **Data minimization** — Only collect what's needed (name, scores). No photos, location, device tracking.
4. **Data retention policy** — Written, public, with specific timeframes per data type
5. **Parent rights endpoints** — Export data, delete data, revoke consent
6. **Account deletion** — Required by both Apple App Store and Google Play (within 90 days)
7. **Audit logging** — Track all access to student data (FERPA disclosure requirement)
8. **Encryption at rest** — Student names, user emails, consent records using Rails AR Encryption
9. **Security program** — Designated security personnel, annual risk assessment (new 2025 requirement)
10. **Privacy policy** — Web-hosted, linked from apps, in plain English

**FERPA conditionally applies** when schools use GrewMe — requires Data Processing Agreement (DPA) with school districts, 45-day access rights, amendment mechanism.

**GDPR Article 8 applies** if deploying to EU/UK — requires DPIA before processing, EU hosting option, DPO designation. Defer to Phase 3+ unless EU launch is planned.

### From Deployment & DevOps (HIGH confidence)

| Component | Recommendation | Notes |
|-----------|---------------|-------|
| Deployment | **Kamal 2** | Current deploy.yml is scaffold-only; needs production configuration |
| Registry | **GitHub Container Registry (ghcr.io)** | Free with GitHub, no separate service |
| VPS | **Hetzner** ($5-10/mo) | Single VPS sufficient for hundreds of concurrent users |
| SSL | **kamal-proxy + Let's Encrypt** | Auto-renewal, zero maintenance |
| DB migrations | **strong_migrations gem** | Catch unsafe migrations before deploy |
| Error tracking | **Sentry** (free tier: 5K errors/mo) or **Honeybadger** (better Rails integration) | Sentry if budget-constrained |
| Logging | **Lograge** | Single JSON line per request, structured |
| Coverage | **SimpleCov** | Ramp from 50% → 80% → 85%+ |
| Mobile CI | **GitHub Actions + matrix builds** | Android on ubuntu, iOS on macos (10x cost) |
| Distribution | **Fastlane** → Google Play Internal / TestFlight | Set up internal tracks first |
| Backups | **pg_dump daily + off-site sync** | Test restore monthly |

---

## Cross-Cutting Themes

### 1. Security Is the Foundation, Not a Feature

All four research files converge on this: GrewMe's current security posture is broken and **blocks everything else**. The JWT fallback secret and open registration are not "nice to fix" — they are show-stoppers. Every researcher flagged them independently.

### 2. Invitation-Only Access Model

The compliance research mandates it (COPPA consent flow), the API research implements it (Pundit policies scoped to owned resources), the mobile research architectures for it (auth state machine), and the DevOps research secures it (rate limiting registration). This is GrewMe's most important architectural decision: **no user can self-register with arbitrary roles.**

### 3. The Radar Chart Is the Product

The KMP researcher explicitly recommends building custom (not using a library) because "GrewMe's radar IS the product." The Rails researcher designs the materialized view optimization around radar data queries. The compliance researcher treats radar charts as education records requiring audit logging. Every domain recognizes this as the core value proposition.

### 4. Test-First or Regret Later

Zero tests currently exist. The Rails researcher provides test patterns, the KMP researcher provides MockEngine/Turbine patterns, and the DevOps researcher sets up coverage infrastructure. All agree: tests must come with features, not after. The coverage ramp-up strategy (50% → 80% → 85%+) is realistic.

### 5. Data Lifecycle Management

COPPA requires written retention policies. FERPA requires disclosure accounting. GDPR requires erasure rights. Apple/Google require account deletion. This cuts across backend (retention jobs, hard deletion), mobile (account deletion UI), and ops (backup strategy that respects deletion).

---

## Consensus Recommendations (All Researchers Agree)

1. **Fix JWT secret and role escalation immediately** — unanimously flagged as critical
2. **Invitation-only access** — compliance demands it, architecture supports it
3. **Rails 8 Solid Stack** (Queue/Cache/Cable) — already in Gemfile, well-documented, production-ready
4. **Pundit for authorization** — simple, testable, fits the role + resource scoping perfectly
5. **Custom radar chart** — core differentiator, must be hand-rolled for MLBB styling control
6. **KMP monorepo consolidation** — do it now while codebase is placeholder-only
7. **Rack::Attack rate limiting** — required for COPPA security, easy to add
8. **Kamal 2 for deployment** — already scaffolded, just needs real configuration
9. **Test alongside features** — every researcher provides test patterns for their domain

---

## Conflicts & Tensions

### 1. Serializer Choice: Alba vs Keeping it Simple
The Rails researcher recommends Alba (new gem dependency). An alternative is using Rails' built-in `render json:` with `as_json` overrides for the small API surface. **Resolution: Go with Alba.** The radar data serialization is complex enough to benefit from a proper serializer, and Alba's zero-dependency nature minimizes risk.

### 2. Audit Logging: PaperTrail vs Custom
The Rails researcher recommends PaperTrail for model versioning. The compliance researcher designs a custom `AuditLogger` service for access logging. **Resolution: Use both.** PaperTrail for data modification history (who changed what), custom AuditLogger for access logging (who viewed what). They serve different COPPA/FERPA requirements.

### 3. Offline Support: Phase 1 vs Later
The KMP researcher includes Room KMP for offline support. The compliance researcher focuses on server-side data lifecycle. **Resolution: Defer Room/offline to Phase 3+.** For MVP, the teacher app needs connectivity to submit scores. Offline queueing is a "nice to have" that adds significant complexity (conflict resolution, sync logic). Start with network-only, add offline later.

### 4. Real-time Updates: WebSocket vs Polling
The Rails researcher mentions Solid Cable for real-time score notifications. **Resolution: Start with polling.** The parent app can poll `/radar` every 10 minutes. WebSocket adds complexity (connection management on mobile, KMP WebSocket support) for marginal UX gain at this stage.

### 5. Error Tracking: Sentry vs Honeybadger
DevOps researcher recommends Honeybadger for Rails-native integration but acknowledges Sentry's better free tier. **Resolution: Start with Sentry** for its generous free tier (5K errors/mo). Switch to Honeybadger if/when the paid plan makes sense.

---

## Implications for Roadmap

### Suggested Phase Structure (6 phases)

#### Phase 1: Security Foundation & Backend Core
**Rationale:** Nothing can be built on a broken security foundation. Fix critical vulnerabilities, wire routes, establish error handling, add authorization. This unblocks everything else.

**Delivers:** Secure, functional Rails API with auth, authorization, and core endpoints.

**Features from research:**
- Fix JWT secret (remove fallback)
- Fix role escalation (remove role from params)
- Wire routes.rb with all v1 endpoints
- Add BaseController with error handling (`rescue_from`)
- Add Pundit authorization with all policies
- Add Rack::Attack rate limiting
- Add Alba serialization for all resources
- Build classrooms, students, daily_scores, parents/children controllers
- Add strong_migrations gem
- Enable `force_ssl`, `assume_ssl`, host authorization

**Pitfalls to avoid:**
- JWT fallback secret (token forgery)
- Open registration (role escalation)
- N+1 queries (enable `strict_loading` in development)

**Research flag:** Standard patterns — no additional research needed.

#### Phase 2: KMP Monorepo & Mobile Foundation
**Rationale:** The two-project structure must be consolidated before any feature work. This is purely structural — no features yet, just the shared module architecture.

**Delivers:** Single Gradle project with shared module, both apps compiling from monorepo, shared Ktor client, shared auth manager, shared theme.

**Features from research:**
- Create root `settings.gradle.kts` with 3 modules (shared, app-teacher, app-parent)
- Move shared dependencies to shared module
- Implement Ktor HttpClient with Auth plugin (bearer token auto-refresh)
- Implement expect/actual TokenStorage (EncryptedSharedPrefs / Keychain)
- Set up Koin DI modules (platform, network, repository, auth)
- Implement shared Material3 theme (GrewMeTheme)
- Define `@Serializable` navigation routes
- Implement auth state machine (Loading/Authenticated/Unauthenticated)
- Build login screen (shared) + navigation graphs (per app)

**Pitfalls to avoid:**
- Monorepo migration is disruptive — do it before ANY features
- iOS Keychain interop requires careful `CFDictionary` handling
- Koin ViewModel resolution — use `koinViewModel()` not `koinInject()`
- Ktor Auth retry loop on expired refresh tokens

**Research flag:** Needs careful testing — Navigation Compose 2.8+ type-safe routes are pre-release.

#### Phase 3: Compliance & Consent Engine
**Rationale:** COPPA compliance deadline is April 22, 2026. This must be built before any school deployment or app store submission. It's also architecturally foundational — the consent flow determines who can access what data.

**Delivers:** Complete COPPA consent workflow, invitation-based access, audit logging, encryption at rest, data export/deletion endpoints.

**Features from research:**
- Invitation model (school admin → teacher invite → parent consent)
- Consent workflow (Email-Plus VPC method)
- Consent record schema with token-based flow
- Replace open registration with invitation-only
- Active Record Encryption for PII fields (student.name, user.email, consent.parent_email, audit.ip_address)
- PaperTrail for data modification audit trail
- Custom AuditLogger for access logging
- Data export endpoint (`GET /students/:id/records/export`)
- Account deletion endpoint (`DELETE /account` with 30-day grace period)
- Data retention cleanup job (via Solid Queue)
- Privacy policy (web-hosted at grewme.app/privacy)

**Pitfalls to avoid:**
- Consent must be recorded BEFORE any data collection (not after)
- Student data cannot be shared with parent until consent is granted
- Active Record Encryption: deterministic vs non-deterministic choice matters (email = deterministic for login lookup, name = non-deterministic for max privacy)
- Account deletion edge cases: teacher deletes account → anonymize attribution, don't delete scores
- Apple requires deletion within 90 days

**Research flag:** **NEEDS DEEP RESEARCH.** The consent workflow is complex and GrewMe-specific. Validate the Email-Plus flow with a legal advisor. Consider the school official exception pathway as primary for school-contracted deployments.

#### Phase 4: Radar Chart & Core Mobile Features
**Rationale:** With backend secure and compliant, and mobile foundation in place, build the actual product features — the radar chart and daily score entry.

**Delivers:** Working teacher app (score entry + radar view) and parent app (radar view + child switching).

**Features from research:**
- Custom radar chart composable (Compose Canvas, 5 axes, animated)
- Teacher: dashboard screen (classroom overview)
- Teacher: student detail screen
- Teacher: daily score entry screen (5 skills per student)
- Teacher: batch score submission
- Parent: dashboard screen (children list)
- Parent: child progress/radar view
- Scenic materialized views for radar data aggregation
- Solid Cache for radar endpoints (10-min TTL, invalidate on score change)
- Refresh materialized view job (debounced after score submission)

**Pitfalls to avoid:**
- Radar chart Canvas text rendering — use `rememberTextMeasurer()` + `drawText()`, NOT native canvas
- Materialized view refresh must be concurrent (not blocking)
- Cache invalidation race conditions when scores update rapidly

**Research flag:** The MLBB-style enhancements (gradient fill, glow effect, comparison overlay) are Phase 4b — standard Canvas patterns, no research needed.

#### Phase 5: DevOps, CI/CD & Quality
**Rationale:** By this point, there's actual code to test, deploy, and monitor. Set up the full pipeline.

**Delivers:** Production deployment pipeline, mobile CI, coverage enforcement, error tracking, staging environment.

**Features from research:**
- Production deploy.yml for Kamal 2 (real server, registry, accessories)
- GitHub Actions: Rails CI (Postgres service, Minitest, SimpleCov, Brakeman)
- GitHub Actions: Mobile CI (composite action, matrix builds)
- SimpleCov coverage enforcement (start 50%, ramp to 80%)
- Sentry error tracking
- Lograge structured logging
- Fastlane setup (Android internal testing, iOS TestFlight)
- Database backup automation (daily pg_dump + off-site sync)
- Seed data for staging (Faker-based)
- Health check endpoint (DB + queue status)

**Pitfalls to avoid:**
- iOS CI runs on macos-latest (10x cost vs ubuntu) — use path filtering to only trigger when mobile code changes
- First KMP Gradle build in CI is slow (5-10 min) — cache `.konan` directory
- SimpleCov must be loaded FIRST in test_helper.rb (before any app code)

**Research flag:** Standard patterns — no additional research needed.

#### Phase 6: Polish & Advanced Features
**Rationale:** Nice-to-have features that enhance UX but aren't required for launch.

**Delivers:** Offline support, real-time updates, MLBB visual enhancements, GDPR readiness.

**Features from research:**
- Room KMP for offline support (cache-first reading, optimistic assessment submission)
- Solid Cable for real-time score notifications to parent app
- MLBB-style radar enhancements (gradient fill, glow, comparison overlay, touch interaction)
- GDPR readiness (DPIA, EU hosting option, DPO designation)
- Annual consent renewal reminders
- Key rotation process
- Breach notification workflow

**Research flag:** Room KMP is relatively new — **needs research** for KMP-specific limitations before implementation. GDPR requirements need legal review if EU launch is planned.

---

## Critical Blockers (Must Resolve First)

| # | Blocker | Blocks | Severity |
|---|---------|--------|----------|
| 1 | **Hardcoded JWT fallback secret** `"dev-secret-key"` | All deployment, all auth | CRITICAL |
| 2 | **Open registration with role from params** | All deployment, COPPA compliance | CRITICAL |
| 3 | **Empty routes.rb** | All API functionality | CRITICAL |
| 4 | **Two separate Gradle projects** (mobile) | All mobile feature development | HIGH |
| 5 | **Zero test coverage** | Quality assurance, CI/CD | HIGH |
| 6 | **No COPPA consent mechanism** | School deployment, app store submission | HIGH (deadline: April 22, 2026) |
| 7 | **No privacy policy** | App store submission | MEDIUM |
| 8 | **Scaffold-only deploy.yml** | Production deployment | MEDIUM |

---

## Open Questions Requiring Product/Business Decisions

1. **School-first or direct-to-parent?** The consent flow differs significantly. If school-contracted, the school official exception simplifies consent (school consents on behalf of parents for educational use). If direct-to-parent, every parent must individually consent via Email-Plus. **Recommendation: School-first.** It's simpler, legally stronger, and matches the product model.

2. **What is the data retention period for scores?** Research recommends "current school year + 1 year." This needs a product decision — do parents want multi-year trend data? Longer retention = more compliance burden.

3. **EU/UK launch timeline?** GDPR compliance (DPIA, EU hosting, DPO) is significant effort. If not launching in EU within 12 months, defer to Phase 6. If EU launch is planned, pull GDPR into Phase 3.

4. **Which 5 skill categories?** The radar chart has 5 axes. The research assumes Reading, Math, Writing, Logic, Social — but this is a product decision. Should they be configurable per school? Fixed categories are simpler to implement and compare.

5. **Score scale: 0-100 or 1-5?** Current model uses 0-100 integer scores. For ages 5-7, a simpler 1-5 star rating might be more appropriate for teachers doing daily entry. This affects the radar chart normalization.

6. **iOS priority?** iOS CI and distribution is 10x more expensive (GitHub Actions minutes) and requires Apple Developer Program ($99/year). If Android-first is acceptable, defer iOS builds to save cost.

7. **Teacher account: one school or multi-school?** Current schema assumes one teacher per school. If substitute teachers or multi-school consultants need access, the data model needs adjustment.

8. **What happens when the school year ends?** Do classrooms archive? Do students move to new classrooms? This affects data lifecycle and the retention cleanup job.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **COPPA non-compliance at launch** | MEDIUM | CRITICAL (FTC enforcement, app store rejection) | Build consent engine in Phase 3, get legal review |
| **Security breach (JWT forgery)** | HIGH (if not fixed) | CRITICAL (data exposure, legal liability) | Fix in Phase 1, day 1 |
| **KMP monorepo migration breaks both apps** | LOW | HIGH (blocks all mobile work) | Do while apps are placeholder-only, low risk |
| **App store rejection (no deletion endpoint)** | HIGH (if missing) | HIGH (blocks launch) | Build in Phase 3 |
| **Navigation Compose API instability** | MEDIUM | MEDIUM (refactoring cost) | Pin version, isolate navigation code |
| **Room KMP limitations** | MEDIUM | LOW (defer offline) | Defer Room to Phase 6, start network-only |
| **Single server failure** | LOW | HIGH (downtime) | Daily backups, quick Kamal redeploy |
| **Scope creep in radar chart** | MEDIUM | MEDIUM (delayed launch) | Build basic 5-axis chart first, MLBB polish later |
| **Test debt accumulation** | HIGH | MEDIUM (regression bugs) | Coverage enforcement in CI from Phase 1 |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Rails API patterns** | HIGH | All recommendations verified via Context7, official docs, multiple 2025-2026 sources. Alba, Pundit, Rack::Attack are production-proven. |
| **KMP mobile patterns** | HIGH | Verified via Context7 (Ktor, Koin, Compose), official JetBrains docs, production GitHub examples. Room KMP is newer (MEDIUM for offline specifically). |
| **Compliance & privacy** | HIGH | Sourced from FTC.gov, ICO.org.uk, Apple/Google developer docs. COPPA 2025 rule is well-documented. **But:** legal interpretation should be validated by counsel. |
| **Deployment & DevOps** | HIGH | Kamal 2, GitHub Actions, Fastlane all well-documented. PostgreSQL patterns are standard. |

### Gaps to Address During Planning

1. **Legal review of consent flow** — The Email-Plus VPC method is compliant per FTC rules, but GrewMe's specific implementation (teacher-mediated, school official exception) should be validated by an education privacy attorney.

2. **School onboarding process** — How does a school sign up? The research covers the technical invitation chain but not the business/sales flow that precedes it.

3. **Notification delivery** — The consent flow requires sending emails to parents. Which email service? (ActionMailer + what SMTP provider?) Not covered in research.

4. **Monitoring/alerting thresholds** — Sentry/Honeybadger are recommended for error tracking, but specific alert rules (e.g., >5 failed auth attempts → alert) need definition.

5. **Accessibility** — No research was done on accessibility requirements for the mobile apps. WCAG compliance may be expected/required for education software.

6. **Localization** — Privacy policy needs translation if deploying in non-English markets. App UI localization strategy not researched.

---

## Aggregated Sources

### HIGH Confidence Sources
- FTC COPPA Rule (ftc.gov) — compliance requirements
- FTC 2025 COPPA Amendments — updated VPC methods, security program
- Rails 8.1.2 Guides (Context7) — Solid Queue/Cache/Cable, AR Encryption, testing
- Alba docs (Context7) — serializer benchmarks and patterns
- Pundit docs (Context7) — authorization patterns
- Rack::Attack docs (Context7) — rate limiting
- Ktor docs (Context7) — HTTP client, Auth plugin, MockEngine
- Koin docs (Context7) — KMP DI, ViewModel scoping
- JetBrains Compose Multiplatform docs — Navigation, Canvas
- Apple Developer docs — App Store requirements, age rating, account deletion
- Google Play Console docs — Data Safety, Families Policy
- ICO Age Appropriate Design Code — UK children's data standards
- Kamal 2 docs (Context7) — deployment configuration
- PostgreSQL 17 docs — backup/restore, connection management
- Fastlane docs (Context7) — mobile distribution

### MEDIUM Confidence Sources
- Scenic gem (production case study, 9000x speedup for materialized views)
- PaperTrail (6.9k GitHub stars, actively maintained)
- Room KMP (official Android docs, but KMP support is newer)
- Honeybadger vs Sentry comparison (community benchmarks)
- Securiti.ai, BBB National Programs (COPPA analysis)
- UpGuard, Island.io (FERPA checklists)
- Kennedys Law (GDPR children's data analysis)
- Various 2025-2026 blog posts (JWT patterns, KMP testing, Kamal deployment)
