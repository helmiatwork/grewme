# GrewMe — Kids Learning Radar App

## Core Value

GrewMe makes children's learning progress visible and actionable. Teachers input daily skill scores for students aged 5–7, and parents see MLBB-style radar charts showing their child's growth across 5 categories. The radar chart IS the product — it transforms abstract education data into an intuitive, game-inspired visualization that parents actually want to check.

## Product Model

- **School-first access:** Schools sign up → invite teachers → teachers invite parents
- **Two apps, one API:** Teacher app (score input) + Parent app (progress viewing)
- **No kid-facing app.** Kids learn in class. Adults use the tools.
- **Fixed 5 categories:** Reading, Math, Writing, Logic, Social (not configurable)
- **Scoring:** 0–100 per skill per day per student
- **COPPA regulated:** Children under 13, personal data collected via teachers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rails 8.1.2 (Ruby 4.0.1), PostgreSQL, API-only |
| Auth | JWT (HS256), bcrypt, role-based (teacher/parent/admin) |
| Queue/Cache/Cable | Solid Queue, Solid Cache, Solid Cable (all PostgreSQL-backed) |
| Teacher App | Kotlin Multiplatform + Compose Multiplatform |
| Parent App | Kotlin Multiplatform + Compose Multiplatform |
| Mobile Libs | Ktor 3.0.3 (network), Koin 4.0.0 (DI), Navigation Compose 2.8+ |
| CI | GitHub Actions |
| Deploy | Kamal 2.10.1 (Docker) |

## Key Libraries (from research)

| Purpose | Choice | Rationale |
|---------|--------|-----------|
| Serialization | Alba | Fastest pure-Ruby, zero deps |
| Authorization | Pundit | Plain Ruby policies, fits role + resource scoping |
| Rate limiting | Rack::Attack | Industry standard, Solid Cache backend |
| Aggregation | Scenic | Materialized views for radar data |
| Audit trail | PaperTrail | Data modification history for COPPA |
| Radar chart | Custom Compose Canvas | Core differentiator (~150 lines) |
| Token storage | expect/actual | EncryptedSharedPrefs / Keychain |
| Error tracking | Sentry | Free tier (5K errors/mo) |
| Logging | Lograge | Structured JSON logging |
| Coverage | SimpleCov | Ramp 50% → 80% → 85%+ |

## Confirmed Product Decisions

1. **Access model:** School-first (invitation chain). COPPA school official exception applies.
2. **Skill categories:** Fixed 5 (Reading, Math, Writing, Logic, Social). Not configurable.
3. **Scoring scale:** 0–100 (fine-grained, current schema).
4. **Platform priority:** Android-first. iOS deferred. KMP shared code.
5. **EU/GDPR:** Deferred. US/COPPA compliance only for now.
6. **Data retention:** Forever (no auto-deletion). Parent can request deletion.
7. **Offline support:** Deferred. Network-only for MVP.
8. **Real-time updates:** Start with polling (10-min TTL). WebSockets later.
9. **Consent method:** Email-Plus VPC (lowest friction for teacher-mediated flow).
10. **Serializer:** Alba (not built-in `as_json`).

## Constraints

- **COPPA compliance deadline:** April 22, 2026 (2025 amended rule)
- **Android-first:** iOS deferred to reduce CI cost and scope
- **Solo developer + Claude:** No team coordination overhead
- **Budget-conscious:** Hetzner VPS ($5–10/mo), free-tier services where possible
- **Monorepo:** Backend + both mobile apps in one repo

## Current State

**What exists:**
- DB schema: 6 tables (schools, users, classrooms, students, parent_students, daily_scores)
- Models with validations and associations
- JWT service (encode/decode) — has critical security flaw
- Auth controller (login/register) — has critical role escalation flaw
- CI pipeline (3 jobs: security scan, lint, test)
- Kamal deploy scaffold

**Critical issues to fix first:**
1. Hardcoded JWT fallback secret `"dev-secret-key"` — token forgery risk
2. Registration permits `role: "admin"` from user input — role escalation
3. ApplicationController missing `include Authenticatable` — auth chain broken
4. Routes.rb empty (only health check)
