# GrewMe — Project State

## Project Reference

| Field | Value |
|-------|-------|
| **Project** | GrewMe — Kids Learning Radar App |
| **Core Value** | Make children's learning progress visible via MLBB-style radar charts |
| **Location** | `/Users/theresiaputri/repo/grewme` |
| **Stack** | Rails 8.1.2 + KMP + Compose Multiplatform |

## Current Position

```
Phase:    Phase 1 — Security Foundation & Backend Core
Plan:     All 9 plans complete (5 waves)
Status:   COMPLETE ✅
```

**Overall Progress:**
```
Phase 1: ██████████ 100%  Security Foundation & Backend Core ✅
Phase 2: ░░░░░░░░░░ 0%   KMP Monorepo & Mobile Foundation
Phase 3: ░░░░░░░░░░ 0%   Compliance & Consent Engine
Phase 4: ░░░░░░░░░░ 0%   Radar Chart & Core Mobile Features
Phase 5: ░░░░░░░░░░ 0%   DevOps, CI/CD & Quality
Phase 6: ░░░░░░░░░░ 0%   Polish & Advanced Features (v2)
```

## Phase Status

| Phase | Status | Plans | Completed |
|-------|--------|-------|-----------|
| 1. Security Foundation & Backend Core | **Complete** ✅ | 9/9 | 2026-03-04 |
| 2. KMP Monorepo & Mobile Foundation | Not started | 0/? | - |
| 3. Compliance & Consent Engine | Not started | 0/? | - |
| 4. Radar Chart & Core Mobile Features | Not started | 0/? | - |
| 5. DevOps, CI/CD & Quality | Not started | 0/? | - |
| 6. Polish & Advanced Features | Not started | 0/? | - |

## Phase 1 — Execution Summary

| Wave | Plan | Status | Description |
|------|------|--------|-------------|
| 1 | 01 | ✅ | JWT hardened (no fallback, 15-min expiry, jti/iat), role escalation fixed, auth chain wired, password min 8 |
| 1 | 02 | ✅ | Fixtures valid (4 users, 1 school, 2 classrooms, 3 students, 3 scores), SimpleCov, AuthTestHelper |
| 2 | 03 | ✅ | All API routes, BaseController with rescue_from, CORS, SSL/host config, Rack::Attack rate limiting |
| 2 | 04 | ✅ | 33 model tests for all 6 models (User, School, Classroom, Student, DailyScore, ParentStudent) |
| 3 | 05 | ✅ | RefreshToken model with rotation, updated auth controller (login/register/refresh return token pairs) |
| 3 | 06 | ✅ | Pundit policies (Classroom, Student, DailyScore), Alba resources (User, Classroom, Student, DailyScore, RadarData, ProgressData) |
| 4 | 07 | ✅ | All read controllers (Classrooms, Students, Parents::Children, nested controllers) |
| 4 | 08 | ✅ | DailyScoresController (create/update), Scenic materialized view, RefreshRadarSummaryJob, seeds, strong_migrations |
| 5 | 09 | ✅ | Integration tests: JWT (9), Auth (12), Classrooms (6), Students (7), DailyScores (5), Parents (2) |

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans completed | 9/9 |
| Plans failed | 0 |
| Success rate | 100% |
| Tests passing | 79 (159 assertions) |
| Code coverage | 84.82% line / 60.26% branch |

## Accumulated Context

### Key Decisions
1. School-first access model — COPPA school official exception applies
2. Fixed 5 skill categories — not configurable
3. Android-first — iOS deferred to Phase 6
4. Alba for serialization, Pundit for authorization
5. Custom Compose Canvas radar chart — core differentiator
6. Email-Plus VPC for parental consent
7. Polling first, WebSockets deferred to Phase 6
8. Offline support deferred to Phase 6
9. Avo for admin panel — deferred to v2 (V2-06)

### Known Issues (Resolved in Phase 1)
1. ~~**CRITICAL:** JWT fallback secret enables token forgery~~ → Fixed: no fallback, raises on missing secret
2. ~~**CRITICAL:** Registration permits `role: "admin"` from user input~~ → Fixed: role stripped from params
3. ~~**CRITICAL:** ApplicationController missing `include Authenticatable`~~ → Fixed: auth chain wired
4. ~~Routes.rb empty~~ → Fixed: 15 API routes defined
5. ~~9/10 API controllers missing~~ → Fixed: all controllers implemented
6. ~~CORS disabled~~ → Fixed: rack-cors configured
7. ~~Zero test coverage~~ → Fixed: 79 tests, 84.82% coverage
8. ~~Broken fixtures~~ → Fixed: valid realistic data

### Remaining Issues
9. Mobile apps are placeholder-only (Phase 2)
10. Two separate Gradle projects — should be monorepo (Phase 2)

### Technical Discoveries (Phase 1)
1. Ruby 4.0.1 — `OpenStruct` requires explicit `require "ostruct"`
2. Rails 7.1+ — `after_action :verify_policy_scoped` causes `ActionNotFound` for controllers without matching actions
3. Thread-based test parallelization breaks with PostgreSQL — use `parallelize(workers: 1)`
4. SimpleCov reports 0% with parallel processes — single-process fixes it
5. Rack::Attack must be disabled in test env to prevent rate-limit interference
6. Cache store in test env needs `:memory_store` (not `:null_store`) for JTI-based token revocation

### Blockers
- None

### TODOs
- [x] Plan Phase 1 (`/gsd-plan-phase 1`) — 9 plans created
- [x] Execute Phase 1 — all 9 plans complete
- [ ] Get legal review of COPPA consent flow before Phase 3
- [ ] Plan Phase 2 (KMP Monorepo & Mobile Foundation)

## Session Continuity

### Last Session
- **Date:** 2026-03-04
- **Action:** Completed all 9 Phase 1 plans — security fixes, API infrastructure, authorization, serialization, controllers, tests
- **Result:** 79 tests passing, 84.82% coverage, all critical security issues resolved
- **Next:** Commit remaining changes, then plan Phase 2

### Context for Next Session
- Phase 1 is fully complete — backend API is functional with auth, CRUD, and tests
- User wants to "finish backend first" before mobile — may want additional backend work before Phase 2
- Phase 2 is KMP Monorepo & Mobile Foundation (Kotlin Multiplatform setup)
- Admin panel decision: Avo (v2, documented in Outline)
