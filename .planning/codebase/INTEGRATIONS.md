# External Integrations

**Analysis Date:** 2026-03-04

## APIs & External Services

**Internal API:**
- Rails 8 JSON API - Backend for both mobile apps
  - Base: `backend/config/routes.rb` (currently only health check endpoint)
  - Auth endpoints: `backend/app/controllers/api/v1/auth_controller.rb` (login, register)
  - Versioned under `/api/v1/` namespace
  - No external third-party API integrations detected

**Mobile-to-Backend Communication:**
- Ktor Client 3.0.3 - HTTP client in mobile apps
  - Android engine: OkHttp (`ktor-client-okhttp`)
  - iOS engine: Darwin (`ktor-client-darwin`)
  - Content negotiation: `ktor-client-content-negotiation` with `ktor-serialization-kotlinx-json`
  - Configured in `commonMain` source set of both apps

## Data Storage

**Databases:**
- PostgreSQL - Primary data store
  - Connection: `DATABASE_URL` env var (production), local socket (development)
  - Client: ActiveRecord (Rails built-in ORM)
  - Config: `backend/config/database.yml`
  - Development DB: `grewme_development`
  - Test DB: `grewme_test`
  - Production: 4 separate databases:
    - `grewme_production` (primary)
    - `grewme_production_cache` (Solid Cache)
    - `grewme_production_queue` (Solid Queue)
    - `grewme_production_cable` (Solid Cable)
  - Schema: `backend/db/schema.rb` (6 tables: users, schools, classrooms, students, daily_scores, parent_students)

**File Storage:**
- Active Storage with local disk service
  - Config: `backend/config/storage.yml`
  - Development: `backend/storage/` directory
  - Test: `backend/tmp/storage/` directory
  - Production: local disk (mounted volume `grewme_storage:/rails/storage`)
  - Cloud storage (S3/GCS) commented out but templated in config
  - Image processing: `image_processing` gem with libvips

**Caching:**
- Solid Cache (PostgreSQL-backed) in production
  - Config: `backend/config/cache.yml`
  - Max size: 256 MB
  - Namespace: Rails environment name
  - Development/test: uses default (in-memory)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication (no external auth provider)
  - Implementation: `backend/app/services/jwt_service.rb`
  - Algorithm: HS256
  - Token expiry: 24 hours
  - Secret: `Rails.application.credentials.secret_key_base` or `SECRET_KEY_BASE` env var
  - Password hashing: bcrypt via `has_secure_password` on `User` model (`backend/app/models/user.rb`)
  - Token extraction: Bearer token from `Authorization` header (`backend/app/controllers/concerns/authenticatable.rb`)
  - Role-based access: enum roles (teacher: 0, parent: 1, admin: 2)

## Background Jobs

**Queue System:**
- Solid Queue 1.3.2 (PostgreSQL-backed, replaces Redis+Sidekiq)
  - Config: `backend/config/queue.yml`
  - Workers: 3 threads, configurable processes via `JOB_CONCURRENCY` env var
  - Polling interval: 0.1s for workers, 1s for dispatchers
  - Runs in-process with Puma in single-server mode (`SOLID_QUEUE_IN_PUMA=true`)
  - Recurring job: `clear_solid_queue_finished_jobs` every hour at :12 (production only, in `backend/config/recurring.yml`)

## WebSocket / Real-time

**Action Cable:**
- Solid Cable 3.0.12 (PostgreSQL-backed)
  - Config: `backend/config/cable.yml`
  - Development: async adapter (in-process only)
  - Test: test adapter
  - Production: `solid_cable` adapter with 0.1s polling, 1-day message retention

## Monitoring & Observability

**Error Tracking:**
- None configured (no Sentry, Honeybadger, or similar gem)

**Logs:**
- Rails default logging to STDOUT in production
  - Tagged with request ID (`config.log_tags = [:request_id]` in `backend/config/environments/production.rb`)
  - Log level: configurable via `RAILS_LOG_LEVEL` env var (default: `info`)
  - Health check `/up` silenced from logs

**Security Scanning:**
- Brakeman 8.0.4 - Static analysis for Rails security vulnerabilities (runs in CI)
- Bundler Audit 0.9.3 - Gem CVE scanning (runs in CI, config at `backend/config/bundler-audit.yml`)

## CI/CD & Deployment

**Hosting:**
- Docker containers via Kamal 2.10.1
  - Deploy config: `backend/config/deploy.yml`
  - Target server: `192.168.0.1` (placeholder, needs configuration)
  - Registry: `localhost:5555` (placeholder, needs configuration)
  - Hooks directory: `backend/.kamal/hooks/` (all sample files)

**CI Pipeline:**
- GitHub Actions (`backend/.github/workflows/ci.yml`)
  - 3 jobs: security scan, lint, test
  - PostgreSQL service container for tests
  - Redis service commented out (not needed with Solid Queue)

**Dependency Updates:**
- Dependabot (`backend/.github/dependabot.yml`)
  - Weekly Bundler and GitHub Actions updates

## Environment Configuration

**Required env vars (production):**
- `RAILS_MASTER_KEY` - Decrypts Rails credentials
- `GREWME_DATABASE_PASSWORD` - PostgreSQL password (per `backend/config/database.yml`)
- `SECRET_KEY_BASE` - Fallback for JWT signing (per `backend/app/services/jwt_service.rb`)

**Optional env vars:**
- `DATABASE_URL` - Overrides database config (used in CI)
- `RAILS_LOG_LEVEL` - Log verbosity (default: `info`)
- `WEB_CONCURRENCY` - Puma worker processes (default: 1)
- `RAILS_MAX_THREADS` - Puma threads and DB pool (default: 3)
- `JOB_CONCURRENCY` - Solid Queue worker processes (default: 1)
- `SOLID_QUEUE_IN_PUMA` - Run queue in Puma process (default in deploy: `true`)
- `PORT` - Puma listen port (default: 3000)
- `PIDFILE` - Puma PID file location

**Secrets location:**
- Rails encrypted credentials (`backend/config/credentials/`)
- Kamal secrets (`backend/.kamal/secrets`)
- Master key: `backend/config/master.key` (gitignored)
- `.env` files (gitignored)

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- None configured

## Email

**Mailer:**
- Action Mailer configured but SMTP not set up
  - Default URL host: `example.com` (placeholder in `backend/config/environments/production.rb`)
  - SMTP settings commented out

## Third-Party SDKs Not Yet Integrated

The following are declared as dependencies but not actively used in application code:
- `rack-cors` - Gem installed but CORS initializer is fully commented out (`backend/config/initializers/cors.rb`). Must be enabled before mobile apps can connect.
- Cloud storage (S3/GCS) - Templates exist in `backend/config/storage.yml` but all commented out. Currently using local disk.

---

*Integration audit: 2026-03-04*
