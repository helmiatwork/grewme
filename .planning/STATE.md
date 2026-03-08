# GrewMe — Project State

## Project Reference

| Field | Value |
|-------|-------|
| **Project** | GrewMe — Kids Learning Radar App |
| **Core Value** | Make children's learning progress visible via MLBB-style radar charts |
| **Location** | `/Users/theresiaputri/repo/grewme` |
| **Stack** | Rails 8.1.2 (GraphQL API) + SvelteKit (web frontend) + KMP (mobile, deferred) |

## Current Position

```
Phase:    Health Checkups Feature (between Phase 3 and Phase 4)
Status:   Planning
```

**Overall Progress:**
```
Phase 1: ██████████ 100%  Security Foundation & Backend Core ✅
Phase 2: ░░░░░░░░░░ 0%   KMP Monorepo & Mobile Foundation (deferred — web-first)
Phase 3: ██████████ 100%  COPPA Compliance & Consent Engine ✅
Phase 4: ░░░░░░░░░░ 0%   Radar Chart & Core Features
Phase 5: ░░░░░░░░░░ 0%   DevOps, CI/CD & Quality
Phase 6: ░░░░░░░░░░ 0%   Polish & Advanced Features (v2)
```

## Phase Status

| Phase | Status | Completed |
|-------|--------|-----------|
| 1. Security Foundation & Backend Core | **Complete** ✅ | 2026-03-04 |
| 2. KMP Monorepo & Mobile Foundation | Deferred (web-first) | - |
| 3. COPPA Compliance & Consent Engine | **Complete** ✅ | 2026-03-08 |
| 4. Radar Chart & Core Features | Not started | - |
| 5. DevOps, CI/CD & Quality | Not started | - |
| 6. Polish & Advanced Features | Not started | - |

## Codebase Summary

The codebase is far more complete than the original 6-phase roadmap suggests:
- **44 models**, **50+ GraphQL mutations**, **19+ queries**
- **45 SvelteKit pages** (exams, curriculum, social feed, messaging, calendar, notifications)
- **454 tests, 1,146 assertions** (67.2% line coverage, 51.9% branch coverage)
- Separate user models: Teacher, Parent, SchoolManager (each with Devise)
- GraphQL is the primary API (single `/graphql` endpoint)
- Avo admin panel at `/avo`

## Phase 3 — Execution Summary (COPPA Compliance)

14 tasks across 9 waves, all complete:

| Wave | Tasks | Description |
|------|-------|-------------|
| 1 | 1-3 | Invitation, Consent, AuditLog models + tests |
| 2 | 4 | Active Record Encryption on all PII fields |
| 3 | 5-6 | Invitation & Consent GraphQL mutations + mailers |
| 4 | 7 | Registration locked to invitation/consent tokens |
| 5 | 8 | Data rights: export, account deletion, child data deletion |
| 6 | 9 | Audit logging integration across all mutations/queries |
| 7 | 10-12 | Frontend: privacy policy, terms, consent pages, data rights dashboard |
| 8 | 13 | Background jobs: consent reminder, consent expiry |
| 9 | 14 | End-to-end integration tests |

**87 files changed, ~3,900 lines added. Branch `feature/coppa-compliance` merged to main.**

## Key Decisions

1. **Web-first development** — No mobile/KMP due to disk space constraints. All features built as SvelteKit web app first, mobile later.
2. School-first access model — COPPA school official exception applies
3. Fixed 5 skill categories — not configurable
4. GraphQL API (not REST) — single `/graphql` endpoint
5. Separate user models (Teacher, Parent, SchoolManager) with Devise
6. Active Record Encryption for all PII
7. Token-based registration only (invitation or consent token required)
8. Email-Plus VPC for parental consent

## Technical Discoveries

### Phase 1
1. Ruby 4.0.1 — `OpenStruct` requires explicit `require "ostruct"`
2. Thread-based test parallelization breaks with PostgreSQL — use `parallelize(workers: 1)`
3. Rack::Attack must be disabled in test env

### Phase 3
1. Active Record Encryption fixtures must use `ciphertext_for()` ERB with single-quote YAML wrapping
2. PostgreSQL `inet` type can't store encrypted ciphertext — use `text` instead
3. `shoulda-context` gem has cosmetic `format_rerun_snippet` error with Rails 8.1.2 (doesn't affect tests)
4. Parent model uses `children` association (not `students`) for has_many through
5. Some mutations use `input:` wrapper, others standalone args

## Next Up

1. **Health Checkups feature** — Design complete at `docs/plans/2026-03-07-health-checkups-design.md`
   - UKS (Indonesian school health) growth monitoring
   - Weight, height, head circumference, auto-BMI
   - Teachers record, parents view (with consent)
2. Continue with Phase 4 (Radar Chart & Core Features)

## Blockers

- None
