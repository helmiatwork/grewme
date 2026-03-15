# Repository Atlas: GrewMe Backend

## Project Responsibility
GrewMe backend is a Rails 8.1.2 GraphQL-first API serving a kids' learning radar app. It provides authentication, authorization, curriculum management, skill assessment (radar charts), exam system, health checkups, attendance, messaging, notifications, and COPPA compliance — all via a single `/graphql` endpoint.

## System Entry Points
| File | Purpose |
|------|---------|
| `config/routes.rb` | Route definitions: GraphQL endpoint, ActionCable, Avo admin |
| `app/controllers/graphql_controller.rb` | Single API entry — receives all GraphQL queries/mutations |
| `app/graphql/grewme_schema.rb` | Schema definition with Dataloader, error handling, query limits |
| `Gemfile` | Dependency manifest (Rails 8.1.2, GraphQL, Devise, Pundit, etc.) |

## Architecture Overview
```
Client (SvelteKit / Mobile)
    ↓ POST /graphql (JWT in header)
GraphqlController
    ↓ extract token → decode JWT → find user
GrewmeSchema.execute(query, context: { current_user })
    ↓
Mutation / Query resolver
    ↓ authorize!(record, :action?) via Pundit
Service / Model logic
    ↓ schedule background jobs (Solid Queue)
Database (PostgreSQL)
    ↓ broadcast via ActionCable
Real-time response to client
```

## Directory Map
| Directory | Responsibility | Detailed Map |
|-----------|---------------|--------------|
| `app/models/` | 54 domain models: Users, Schools, Curriculum, Assessment, Communication, Compliance | [View](app/models/codemap.md) |
| `app/models/concerns/` | Shared model behaviors: Permissionable, AccessCodeGenerator | [View](app/models/concerns/codemap.md) |
| `app/graphql/` | GraphQL schema, base types, Dataloader config | [View](app/graphql/codemap.md) |
| `app/graphql/types/` | 120 type definitions: entity types, enums, inputs, unions, connections | [View](app/graphql/types/codemap.md) |
| `app/graphql/mutations/` | 40 mutations: auth, CRUD, assessment, compliance | [View](app/graphql/mutations/codemap.md) |
| `app/graphql/mutations/admin/` | Admin-only mutations: permissions, school management | [View](app/graphql/mutations/admin/codemap.md) |
| `app/graphql/resolvers/` | Query resolvers for complex data fetching | [View](app/graphql/resolvers/codemap.md) |
| `app/services/` | Business logic: MasteryEvaluation, Notifications, AuditLogger | [View](app/services/codemap.md) |
| `app/jobs/` | Background jobs: radar refresh, mastery eval, push notifications | [View](app/jobs/codemap.md) |
| `app/policies/` | 22 Pundit policies: role-based authorization for every resource | [View](app/policies/codemap.md) |
| `app/controllers/` | HTTP layer: GraphqlController, Avo admin controllers | [View](app/controllers/codemap.md) |
| `app/controllers/concerns/` | Shared controller behaviors: Authenticatable (JWT) | [View](app/controllers/concerns/codemap.md) |
| `app/channels/` | ActionCable channels: notifications, chat, group chat | [View](app/channels/codemap.md) |
| `app/mailers/` | Email delivery: invitations, consent requests | [View](app/mailers/codemap.md) |
| `app/avo/` | Avo admin panel configuration | [View](app/avo/codemap.md) |
| `app/avo/resources/` | Avo resource definitions for each model | [View](app/avo/resources/codemap.md) |
| `config/` | Rails configuration, initializers, credentials | [View](config/codemap.md) |
| `config/initializers/` | Gem initializers: Devise, Pundit, Sentry, RBAC defaults | [View](config/initializers/codemap.md) |
| `config/environments/` | Environment-specific settings (dev, test, prod) | [View](config/environments/codemap.md) |
| `db/` | Schema, migrations, seeds, views | [View](db/codemap.md) |
| `db/migrate/` | Migration files for schema evolution | [View](db/migrate/codemap.md) |
| `db/seeds/` | Seed data for development/testing | [View](db/seeds/codemap.md) |
| `lib/` | Utilities: ApiError, Rake tasks | [View](lib/codemap.md) |

## Key Dependencies
| Gem | Purpose |
|-----|---------|
| `rails 8.1.2` | Framework |
| `graphql 2.5` | API layer |
| `devise 5.0` + `devise-jwt 0.12` | Authentication |
| `pundit 2.5` | Authorization |
| `solid_queue` / `solid_cache` / `solid_cable` | Background jobs, caching, WebSockets (all PostgreSQL-backed) |
| `lockbox 2.1` + `blind_index 2.3` | Encryption at rest |
| `paper_trail 17.0` | Audit trail |
| `scenic 1.8` | Database views |
| `avo 3.16` | Admin panel |
| `sentry-rails 6.4` | Error tracking |
| `rack-attack 6.8` | Rate limiting |

## Key Architectural Decisions
1. **GraphQL-only API** — No REST endpoints; single `/graphql` entry point
2. **Separate user models** — Teacher, Parent, SchoolManager, AdminUser (not STI)
3. **Solid Stack** — Queue, Cache, Cable all backed by PostgreSQL (no Redis needed)
4. **Encryption at rest** — All PII (names, emails) encrypted via Lockbox
5. **COPPA compliance** — School-first access, invitation-only registration, parental consent
6. **Fixed 5 skill categories** — Reading, Math, Writing, Logic, Social (enum, not configurable)
