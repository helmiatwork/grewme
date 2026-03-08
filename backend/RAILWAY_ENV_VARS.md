# Railway Environment Variables

Set these in Railway dashboard → Variables:

## Required

| Variable | Description | Example |
|----------|-------------|---------|
| `RAILS_MASTER_KEY` | From `config/master.key` | (64-char hex) |
| `DATABASE_URL` | Auto-set by Railway Postgres plugin | `postgresql://...` |
| `SECRET_KEY_BASE` | `bin/rails secret` | (128-char hex) |

## Optional (Recommended)

| Variable | Description | Example |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry project DSN | `https://xxx@sentry.io/yyy` |
| `RAILS_LOG_LEVEL` | Log verbosity | `info` (default) |
| `GREWME_DATABASE_PASSWORD` | If not using DATABASE_URL | (password) |

## Auto-Set by Railway

| Variable | Description |
|----------|-------------|
| `PORT` | Port to bind (Railway sets this) |
| `RAILWAY_GIT_COMMIT_SHA` | Git commit for Sentry release tracking |
| `RAILWAY_ENVIRONMENT` | `production` |

## Multi-Database Note

Railway provisions a single Postgres instance. For Solid Cache/Queue/Cable,
all four databases (primary, cache, queue, cable) share the same Postgres
server. Create them manually after first deploy:

```sql
CREATE DATABASE grewme_production_cache;
CREATE DATABASE grewme_production_queue;
CREATE DATABASE grewme_production_cable;
```

Or use a single database with schema-based separation (simpler for Railway).
