# GrewMe — Repository Atlas

## Project Responsibility
GrewMe is a kids' learning radar app for Indonesian schools. It makes children's learning progress visible via MLBB-style radar charts across 5 fixed skill categories (Reading, Math, Writing, Logic, Social). The system serves three user roles — teachers recording progress, parents viewing reports, and school managers overseeing classrooms.

## System Architecture
```
┌─────────────────────────────────────────────┐
│  Clients                                     │
│  ├── SvelteKit web app (front-end/)          │
│  ├── React Native parent app (mobile/ [WIP]) │
│  └── React Native teacher app (mobile/ [WIP])│
└──────────────┬──────────────────────────────┘
               │  POST /graphql (JWT auth)
┌──────────────▼──────────────────────────────┐
│  Rails 8.1.2 Backend (backend/)             │
│  ├── GraphQL API (single endpoint)          │
│  ├── ActionCable (WebSocket, Solid Cable)   │
│  ├── Background jobs (Solid Queue)          │
│  └── Avo admin panel (/avo)                 │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  PostgreSQL (primary data store)            │
│  Solid Queue / Cache / Cable tables         │
└─────────────────────────────────────────────┘
```

## Directory Map
| Directory | Status | Responsibility | Detailed Map |
|-----------|--------|---------------|--------------|
| `backend/` | Active | Rails 8.1.2 GraphQL API | [View](backend/codemap.md) |
| `front-end/` | Active | SvelteKit web app (teacher, parent, school admin) | [View](front-end/CODEMAP.md) |
| `mobile/` | Planned | React Native + Expo monorepo (replaces KMP apps) | *(not yet scaffolded)* |
| `mobile-app-parent/` | Deprecated | KMP/Compose parent app (replaced by React Native) | [View](mobile-app-parent/codemap.md) |
| `mobile-app-teacher/` | Deprecated | KMP/Compose teacher app (replaced by React Native) | [View](mobile-app-teacher/codemap.md) |
| `docs/superpowers/specs/` | Reference | Design specs for all features | [View](docs/superpowers/specs/codemap.md) |
| `docs/superpowers/plans/` | Reference | Implementation plans | [View](docs/superpowers/plans/codemap.md) |

## Key Architectural Decisions
1. **GraphQL-only API** — single `/graphql` endpoint; no REST
2. **Separate user models** — Teacher, Parent, SchoolManager, AdminUser (not STI)
3. **COPPA compliance** — invitation-only registration, parental consent, data export/deletion
4. **Fixed 5 skill categories** — enum, not configurable (Reading, Math, Writing, Logic, Social)
5. **Solid Stack** — Queue + Cache + Cable backed by PostgreSQL (no Redis)
6. **Web-first** — SvelteKit fully implemented; React Native mobile replacing KMP (in planning)
7. **Encryption at rest** — Lockbox encrypts all PII (names, emails)

## Tech Stack Summary
| Layer | Technology |
|-------|-----------|
| Backend | Rails 8.1.2, GraphQL-Ruby 2.5, Devise + JWT, Pundit, Solid Queue |
| Web frontend | SvelteKit 2.50.2, TypeScript, Tailwind 4.2.1, D3/LayerCake charts |
| Mobile (planned) | React Native, Expo SDK 52, Apollo Client 3, Zustand 5, Expo Router |
| Database | PostgreSQL |
| Admin | Avo 3.16 |
| Auth | JWT tokens (Devise-JWT), Firebase FCM (push notifications) |
