# DevOps & Production Deployment Design

**Status:** Approved, ready for implementation.

## Architecture

- **Backend:** Rails 8.1.2 on Railway (managed Postgres, auto-deploy from GitHub)
- **Frontend:** SvelteKit on Vercel (free tier, auto-deploy from GitHub)
- **Monitoring:** Sentry (error tracking) + Lograge (structured JSON logging)
- **CI:** GitHub Actions (already exists — Brakeman, RuboCop, Minitest)

## What Already Exists

- Dockerfile (multi-stage, production-optimized)
- GitHub Actions CI (`backend/.github/workflows/ci.yml`)
- Kamal config (partial — switching to Railway instead)
- Sentry gems (sentry-ruby, sentry-rails — not configured)
- Lograge gem (included — not configured)
- Health check endpoint (`/up`)
- Production environment config (SSL, caching, queuing)
- Multi-database config (primary, cache, queue, cable)

## Tasks

### 1. Sentry Initializer
- Create `backend/config/initializers/sentry.rb`
- DSN from Rails credentials (`Rails.application.credentials.dig(:sentry, :dsn)`)
- Filter sensitive params, set environment, enable breadcrumbs
- Add `SENTRY_DSN` to Railway env vars

### 2. Lograge Initializer
- Create `backend/config/initializers/lograge.rb`
- JSON format, custom payload (user_id, user_type, request_id, duration)
- Silence health check requests

### 3. Railway Config (Backend)
- Create `backend/railway.toml` with build/deploy commands
- Document required env vars (DATABASE_URL, RAILS_MASTER_KEY, SENTRY_DSN, etc.)
- Railway auto-provisions Postgres; configure for multi-DB (Solid gems)
- Note: Railway uses Nixpacks for Ruby/Rails auto-detection

### 4. Vercel Config (Frontend)
- Add `@sveltejs/adapter-vercel` to frontend
- Create `front-end/vercel.json` for config
- Update `svelte.config.js` to use Vercel adapter
- Set `PUBLIC_API_URL` env var pointing to Railway backend

### 5. Staging Seed Data
- Create `backend/db/seeds/staging.rb` with Faker
- Generate: 2 schools, 4 teachers, 8 parents, 20 students, classrooms, scores, health checkups
- Idempotent (safe to run multiple times)
- Triggered via `RAILS_ENV=staging bin/rails db:seed`
