# Deployment, DevOps & Quality Infrastructure for GrewMe

**Domain:** Production deployment, CI/CD, testing, monitoring, and security hardening
**Researched:** 2026-03-04
**Overall Confidence:** HIGH (Context7 + official docs + multiple verified sources)

---

## Table of Contents

1. [Kamal 2 Production Deployment](#1-kamal-2-production-deployment)
2. [PostgreSQL Production](#2-postgresql-production)
3. [GitHub Actions for KMP](#3-github-actions-for-kmp)
4. [Mobile App Distribution](#4-mobile-app-distribution)
5. [Test Infrastructure](#5-test-infrastructure)
6. [Monitoring & Observability](#6-monitoring--observability)
7. [Rate Limiting](#7-rate-limiting)
8. [SSL/TLS](#8-ssltls)
9. [Database Seeding for Staging](#9-database-seeding-for-staging)
10. [Security Hardening](#10-security-hardening)
11. [Recommended Implementation Order](#11-recommended-implementation-order)

---

## 1. Kamal 2 Production Deployment

**Confidence: HIGH** (Context7 official Kamal docs)

### Current State

The existing `deploy.yml` is scaffold-only: placeholder IP `192.168.0.1`, `localhost:5555` registry, SSL proxy commented out, no accessories configured. It's non-functional for production.

### Production deploy.yml Configuration

Replace the current scaffold with a production-ready configuration:

```yaml
service: grewme
image: your-dockerhub-username/grewme

servers:
  web:
    - YOUR_SERVER_IP
    hosts:
      - YOUR_SERVER_IP

proxy:
  ssl: true
  host: api.grewme.app
  healthcheck:
    path: /up
    interval: 3
    timeout: 3
  response_timeout: 30
  buffering:
    requests: true
    responses: true
    max_request_body: 10_000_000  # 10MB limit for API

registry:
  server: ghcr.io  # Use GitHub Container Registry (free for public, included with GitHub Teams)
  username:
    - KAMAL_REGISTRY_USERNAME
  password:
    - KAMAL_REGISTRY_PASSWORD

env:
  secret:
    - RAILS_MASTER_KEY
    - GREWME_DATABASE_PASSWORD
  clear:
    SOLID_QUEUE_IN_PUMA: true
    WEB_CONCURRENCY: 2
    RAILS_MAX_THREADS: 3
    RAILS_LOG_LEVEL: info

volumes:
  - "grewme_storage:/rails/storage"

builder:
  arch: amd64
  # If building on Apple Silicon, use a remote builder:
  # remote: ssh://docker@your-builder-server

accessories:
  db:
    image: postgres:17
    host: YOUR_SERVER_IP
    port: "127.0.0.1:5432:5432"
    env:
      clear:
        POSTGRES_DB: grewme_production
        POSTGRES_USER: grewme
      secret:
        - GREWME_DATABASE_PASSWORD
    directories:
      - postgres-data:/var/lib/postgresql/data
    options:
      restart: unless-stopped
      memory: 2g
      cpus: 1

aliases:
  console: app exec --interactive --reuse "bin/rails console"
  shell: app exec --interactive --reuse "bash"
  logs: app logs -f
  dbc: app exec --interactive --reuse "bin/rails dbconsole --include-password"
```

### Secrets Management

Kamal 2 uses `.kamal/secrets` (dotenv format, git-ignored) with variable substitution:

```shell
# .kamal/secrets
KAMAL_REGISTRY_USERNAME=$KAMAL_REGISTRY_USERNAME
KAMAL_REGISTRY_PASSWORD=$KAMAL_REGISTRY_PASSWORD
RAILS_MASTER_KEY=$(cat config/master.key)
GREWME_DATABASE_PASSWORD=$GREWME_DATABASE_PASSWORD
```

**Use GitHub Container Registry (ghcr.io)** — free with GitHub, no separate registry needed. Set `KAMAL_REGISTRY_PASSWORD` to a GitHub Personal Access Token with `write:packages` scope.

For more advanced setups, Kamal 2 supports `kamal secrets fetch` / `kamal secrets extract` for pulling from password managers (1Password, Bitwarden, AWS SSM, etc.).

### Zero-Downtime Deploys

Kamal 2's `kamal-proxy` handles zero-downtime automatically:
1. Builds new Docker image
2. Pushes to registry
3. Starts new container on target server
4. Health-checks the new container at `/up` (configurable path, interval, timeout)
5. Only switches traffic from old to new once health check returns 200
6. Stops old container

**Rollback** is straightforward:
```bash
kamal app containers -q    # list available versions
kamal rollback <version>   # rollback to specific version
```

### Deploy Hooks

Kamal supports hooks in `.kamal/hooks/` for deployment lifecycle:
- `pre-connect` — before connecting to servers
- `pre-build` — before building Docker image
- `pre-deploy` — before deploying (good for running `db:migrate`)
- `post-deploy` — after deployment (notifications, etc.)

### Recommended VPS Providers

For a small-scale education app:
- **Hetzner** — Best price/performance (~$5-10/mo for 2 vCPU, 4GB RAM)
- **DigitalOcean** — $6-12/mo droplets, good UX
- **AWS Lightsail** — If you want AWS ecosystem at fixed pricing

A single $10/mo VPS can comfortably run the Rails API + PostgreSQL + Solid Queue for hundreds of concurrent users.

### Database Migrations During Deploy

The Rails Docker entrypoint (`bin/docker-entrypoint`) already runs `db:prepare` on boot. For production:
1. Run migrations as part of the deploy (automatic via entrypoint)
2. Use `strong_migrations` gem to catch unsafe migrations (see section 2)
3. For large migrations, run them manually before deploy via `kamal app exec`

---

## 2. PostgreSQL Production

**Confidence: HIGH** (official PostgreSQL docs + multiple verified sources)

### Connection Pooling: Rails Pool vs PgBouncer

**Recommendation: Start with Rails connection pool, add PgBouncer when needed.**

| Factor | Rails Pool | PgBouncer |
|--------|-----------|-----------|
| Setup complexity | Zero — built-in | Moderate — separate service |
| When sufficient | < 50 concurrent connections | > 50 concurrent connections |
| Pool modes | N/A | Session, Transaction, Statement |
| Overhead | None | Minimal (~2MB RAM) |

**For GrewMe's scale (single VPS, 2 Puma workers × 3 threads = 6 connections):** Rails pool is sufficient. The current `max_connections: 5` in `database.yml` should be increased to match Puma:

```yaml
# database.yml production
max_connections: <%= ENV.fetch("RAILS_MAX_THREADS") { 3 } %>
```

The formula: `max_connections >= RAILS_MAX_THREADS * WEB_CONCURRENCY`. With 3 threads × 2 workers = 6. Add buffer → set to 10.

**Note:** GrewMe uses 4 PostgreSQL databases (primary, cache, queue, cable). Each gets its own connection pool. With 2 workers × 3 threads × 4 databases = 24 connections total. Default PostgreSQL `max_connections` is 100, which is plenty.

**When to add PgBouncer:** If you move to multiple app servers or > 100 total connections. At that point, run PgBouncer as a Kamal accessory:

```yaml
accessories:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    host: YOUR_SERVER_IP
    port: "127.0.0.1:6432:6432"
    env:
      clear:
        DATABASE_URL: "postgres://grewme:PASSWORD@localhost:5432/grewme_production"
        POOL_MODE: transaction
        DEFAULT_POOL_SIZE: 20
        MAX_CLIENT_CONN: 200
```

### Backup Strategy

**Recommendation: Automated `pg_dump` with cron + off-site storage.**

For GrewMe's scale, `pg_dump` in custom format is ideal:

```bash
#!/bin/bash
# /opt/backups/backup_postgres.sh
BACKUP_DIR="/opt/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Backup all 4 databases
for DB in grewme_production grewme_production_cache grewme_production_queue grewme_production_cable; do
  pg_dump -Fc -h localhost -U grewme "$DB" > "${BACKUP_DIR}/${DB}_${TIMESTAMP}.dump"
done

# Remove backups older than retention period
find "$BACKUP_DIR" -name "*.dump" -mtime +$RETENTION_DAYS -delete

# Sync to off-site storage (S3, Backblaze B2, etc.)
# aws s3 sync "$BACKUP_DIR" s3://grewme-backups/postgresql/
```

Run via cron: `0 2 * * * /opt/backups/backup_postgres.sh` (daily at 2 AM).

**For the Kamal-managed PostgreSQL accessory**, run backup via:
```bash
kamal accessory exec db "pg_dump -Fc -U grewme grewme_production" > backup.dump
```

**Backup priorities:**
- Primary database: Daily full backup + keep 30 days
- Cache/Queue/Cable: Weekly (these are ephemeral/regenerable)
- Test restore monthly to verify backups work

### Migration Safety with strong_migrations

**Confidence: HIGH** (Context7 verified)

Add to `Gemfile`:
```ruby
gem "strong_migrations"
```

Generate initializer:
```bash
bin/rails generate strong_migrations:install
```

Configure in `config/initializers/strong_migrations.rb`:
```ruby
StrongMigrations.safe_by_default = true

# Set the PostgreSQL version for version-specific safety checks
StrongMigrations.target_postgresql_version = "17"

# Timeouts for DDL operations
StrongMigrations.lock_timeout = 10.seconds
StrongMigrations.statement_timeout = 1.hour
```

**What strong_migrations catches:**
- Adding columns with default values (locks table in older PG, safe in PG 11+)
- Removing columns without first ignoring them in the model
- Adding indexes without `algorithm: :concurrently`
- Changing column types (requires full table rewrite)
- Setting NOT NULL on existing columns without check constraints

**Safe migration workflow:**
1. Write migration
2. Run `bin/rails db:migrate` in development — strong_migrations blocks unsafe operations
3. Follow the suggested safe alternative
4. Deploy with confidence

### Monitoring

- Use `pg_stat_statements` extension for slow query analysis
- Monitor connection count: `SELECT count(*) FROM pg_stat_activity;`
- Monitor table bloat and run `VACUUM ANALYZE` via scheduled job

---

## 3. GitHub Actions for KMP

**Confidence: HIGH** (Kotlin official docs + multiple verified sources)

### Architecture: Composite Action + Matrix Builds

Following the official Kotlin Multiplatform CI guide, use a reusable composite action for Gradle setup:

```yaml
# .github/actions/gradle-setup/action.yml
name: gradle-setup
description: Setup Java and Gradle for KMP builds
runs:
  using: "composite"
  steps:
    - name: Setup Java
      uses: actions/setup-java@v4
      with:
        java-version: "17"
        distribution: "temurin"
    - name: Setup Gradle
      uses: gradle/actions/setup-gradle@v5
```

### CI Workflow for Both Mobile Apps

```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI

on:
  push:
    branches: [main]
    paths:
      - 'mobile-app-teacher/**'
      - 'mobile-app-parent/**'
  pull_request:
    paths:
      - 'mobile-app-teacher/**'
      - 'mobile-app-parent/**'

env:
  GRADLE_OPTS: >-
    -Dorg.gradle.jvmargs=-Xmx4096M
    -Dorg.gradle.daemon=false
    -Dorg.gradle.parallel=true
    -Dorg.gradle.caching=true

jobs:
  test:
    name: Test ${{ matrix.app }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [mobile-app-teacher, mobile-app-parent]
    steps:
      - uses: actions/checkout@v6
      - uses: ./.github/actions/gradle-setup

      - name: Run tests
        run: ./gradlew jvmTest
        working-directory: ${{ matrix.app }}

      - name: Upload test reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-reports-${{ matrix.app }}
          path: "${{ matrix.app }}/**/build/reports/tests/"

  build-android:
    name: Build Android ${{ matrix.app }}
    runs-on: ubuntu-latest
    needs: test
    strategy:
      matrix:
        app: [mobile-app-teacher, mobile-app-parent]
    steps:
      - uses: actions/checkout@v6
      - uses: ./.github/actions/gradle-setup

      - name: Build Android debug APK
        run: ./gradlew :composeApp:assembleDebug
        working-directory: ${{ matrix.app }}

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: android-apk-${{ matrix.app }}
          path: "${{ matrix.app }}/composeApp/build/outputs/apk/debug/*.apk"

  build-ios:
    name: Build iOS ${{ matrix.app }}
    runs-on: macos-latest
    needs: test
    strategy:
      matrix:
        app: [mobile-app-teacher, mobile-app-parent]
    steps:
      - uses: actions/checkout@v6
      - uses: ./.github/actions/gradle-setup

      - name: Build iOS framework
        run: ./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64
        working-directory: ${{ matrix.app }}
```

### Gradle Caching

The `gradle/actions/setup-gradle@v5` action handles caching automatically. It caches:
- `~/.gradle/caches` — dependency cache
- `~/.gradle/wrapper` — Gradle wrapper distributions
- Build output caches (via Gradle build cache)

**Additional caching for KMP-specific artifacts:**
```yaml
      - name: Cache Kotlin/Native prebuilt
        uses: actions/cache@v4
        with:
          path: ~/.konan
          key: konan-${{ runner.os }}-${{ hashFiles('**/*.gradle.kts', '**/gradle/libs.versions.toml') }}
          restore-keys: konan-${{ runner.os }}-
```

### Key Considerations

- **Android builds** run on `ubuntu-latest` (fast, cheap)
- **iOS builds** MUST run on `macos-latest` (required for Xcode/Swift toolchain, ~10x more expensive in GitHub Actions minutes)
- **Path filtering** ensures mobile CI only runs when mobile code changes
- **Matrix builds** test both apps in parallel
- First KMP build is slow (~5-10 min) due to Gradle/Kotlin/Native downloads; subsequent builds with cache are ~2-3 min

---

## 4. Mobile App Distribution

**Confidence: HIGH** (Fastlane official docs via Context7)

### Fastlane for Both Platforms

**Install Fastlane** in each mobile app directory:

```bash
# For each app (teacher and parent)
cd mobile-app-teacher/composeApp
fastlane init

cd mobile-app-parent/composeApp
fastlane init
```

### Android: Google Play Internal Testing

```ruby
# mobile-app-teacher/composeApp/fastlane/Fastfile
platform :android do
  lane :internal do
    gradle(
      task: "bundleRelease",
      project_dir: ".."
    )
    upload_to_play_store(
      track: "internal",
      aab: "../build/outputs/bundle/release/composeApp-release.aab",
      json_key: "play-store-service-account.json",
      package_name: "com.grewme.teacher"
    )
  end
end
```

**Setup requirements:**
1. Create a Google Play Console developer account ($25 one-time)
2. Create a Google Cloud service account with Play Console API access
3. Base64-encode the service account JSON and store as GitHub secret
4. Base64-encode the Android signing keystore and store as GitHub secret

### iOS: TestFlight

```ruby
# mobile-app-teacher/iosApp/fastlane/Fastfile
platform :ios do
  lane :beta do
    setup_ci if ENV['CI']
    match(type: 'appstore')
    build_app(
      scheme: "iosApp",
      export_method: "app-store"
    )
    upload_to_testflight(skip_waiting_for_build_processing: true)
  end
end
```

**Setup requirements:**
1. Apple Developer Program enrollment ($99/year)
2. Use `fastlane match` for code signing management (stores certs in a private Git repo)
3. Store App Store Connect API key as GitHub secret

### GitHub Actions Release Workflow

```yaml
# .github/workflows/mobile-release.yml
name: Mobile Release

on:
  push:
    tags:
      - 'v*-teacher-android'
      - 'v*-parent-android'

jobs:
  release-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: ./.github/actions/gradle-setup
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true

      - name: Decode keystore
        run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > release.jks

      - name: Build and upload
        run: fastlane android internal
        env:
          KEYSTORE_PATH: ${{ github.workspace }}/release.jks
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
```

### Distribution Strategy for GrewMe

| Phase | Android | iOS |
|-------|---------|-----|
| Development | Debug APK from CI artifacts | Xcode simulator build |
| Internal testing | Google Play Internal Testing | TestFlight |
| Beta | Google Play Closed Testing | TestFlight (external) |
| Production | Google Play Production | App Store |

**Start with internal testing tracks.** Don't set up full production deployment until the apps have core features.

---

## 5. Test Infrastructure

**Confidence: HIGH** (verified with official docs + community guides)

### SimpleCov Setup for Rails

Add to `Gemfile`:
```ruby
group :test do
  gem "simplecov", require: false
end
```

Configure in `test/test_helper.rb` (**MUST be the very first lines before any app code**):
```ruby
require "simplecov"
SimpleCov.start "rails" do
  coverage_dir "coverage"
  minimum_coverage 80  # Start at 80%, increase over time
  minimum_coverage_by_file 50  # No single file below 50%

  add_filter "/test/"
  add_filter "/config/"
  add_filter "/db/"

  add_group "Models", "app/models"
  add_group "Controllers", "app/controllers"
  add_group "Services", "app/services"
  add_group "Concerns", "app/controllers/concerns"
end

# ... rest of test_helper.rb
require "rails/test_help"
# ...
```

### Coverage Threshold Enforcement in CI

Update the CI workflow to fail on low coverage:

```yaml
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: --health-cmd="pg_isready" --health-interval=10s --health-timeout=5s --health-retries=3
    steps:
      - uses: actions/checkout@v6
      - uses: ruby/setup-ruby@v1
        with:
          bundler-cache: true

      - name: Run tests with coverage
        env:
          RAILS_ENV: test
          DATABASE_URL: postgres://postgres:postgres@localhost:5432
        run: bin/rails db:test:prepare test

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
```

SimpleCov's `minimum_coverage` configuration causes the test suite to exit with a non-zero status when coverage drops below the threshold, which automatically fails the CI job.

### Coverage Ramp-Up Strategy

| Phase | Minimum Coverage | Focus |
|-------|-----------------|-------|
| Now (0%) | 50% | Auth, models, services |
| After core API built | 70% | Controllers, integration tests |
| Before launch | 80% | All critical paths |
| Ongoing | 85%+ | Maintain with each PR |

### Test Parallelization

Already configured in `test_helper.rb`:
```ruby
parallelize(workers: :number_of_processors)
```

This uses Rails' built-in parallel testing with processes. Each worker gets its own database copy. Works automatically with PostgreSQL service containers in CI.

**For CI optimization**, use `PARALLEL_WORKERS` env var:
```yaml
env:
  PARALLEL_WORKERS: 2  # Match the CI runner's available CPUs
```

### Fixing the Existing Test Infrastructure

**Immediate fixes needed before coverage is meaningful:**

1. **Fix broken fixtures** — Replace all `MyString` placeholders with valid data:
```yaml
# test/fixtures/users.yml
teacher_one:
  name: Sarah Johnson
  email: sarah@school.example.com
  password_digest: <%= BCrypt::Password.create("password123") %>
  role: 0  # teacher

parent_one:
  name: Michael Lee
  email: michael@parent.example.com
  password_digest: <%= BCrypt::Password.create("password123") %>
  role: 1  # parent
```

2. **Write P0 tests first** — JwtService, Authenticatable concern, AuthController
3. **Write P1 tests** — All model validations and associations

---

## 6. Monitoring & Observability

**Confidence: HIGH** (Context7 for Sentry, official docs for Honeybadger)

### Error Tracking: Use Honeybadger

**Recommendation: Honeybadger over Sentry for GrewMe.**

| Factor | Sentry | Honeybadger |
|--------|--------|-------------|
| Rails integration | Good | Excellent (built for Ruby) |
| Setup complexity | Moderate (self-hostable) | Simple (SaaS only) |
| Pricing | Free tier: 5K errors/mo | Free tier: 1 project, limited |
| APM included | Yes | Yes (uptime, check-ins) |
| Kamal integration | Manual | Built-in deploy tracking hook |
| Best for | Multi-language polyglot | Ruby/Rails focused team |

**Why Honeybadger:** Native Kamal deploy tracking hook, simpler setup for small teams, excellent Rails integration, less configuration overhead. Honeybadger docs specifically cover Kamal deployment tracking.

However, **if budget is the primary concern**, Sentry's free tier is more generous (5K errors/mo vs limited Honeybadger free tier).

**Sentry setup (if choosing Sentry for free tier):**

Add to `Gemfile`:
```ruby
gem "sentry-ruby"
gem "sentry-rails"
```

```ruby
# config/initializers/sentry.rb
Sentry.init do |config|
  config.dsn = Rails.application.credentials.dig(:sentry, :dsn)
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]
  config.traces_sample_rate = 0.1  # 10% of transactions for performance monitoring
  config.environment = Rails.env
  config.enabled_environments = %w[production staging]

  # Filter sensitive data
  config.before_send = lambda do |event, hint|
    event.request.data = "[FILTERED]" if event.request&.data
    event
  end
end
```

### Structured Logging with Lograge

**Recommendation: Use Lograge** — it condenses Rails' 5-line-per-request logging into a single structured JSON line.

Add to `Gemfile`:
```ruby
gem "lograge"
```

Configure in `config/environments/production.rb`:
```ruby
config.lograge.enabled = true
config.lograge.formatter = Lograge::Formatters::Json.new

config.lograge.custom_options = lambda do |event|
  {
    request_id: event.payload[:request_id],
    user_id: event.payload[:user_id],
    ip: event.payload[:ip],
    user_agent: event.payload[:user_agent]
  }
end

config.lograge.custom_payload do |controller|
  {
    user_id: controller.try(:current_user)&.id,
    ip: controller.request.remote_ip,
    user_agent: controller.request.user_agent
  }
end
```

**Output example:**
```json
{"method":"GET","path":"/api/v1/classrooms","format":"json","controller":"Api::V1::ClassroomsController","action":"index","status":200,"duration":45.2,"view":12.1,"db":8.3,"request_id":"abc-123","user_id":42,"ip":"1.2.3.4"}
```

### Health Check Endpoints

Rails 8 already provides `/up` as a health check (silenced from logs). For more comprehensive health checks:

```ruby
# config/routes.rb
get "up" => "rails/health#show", as: :rails_health_check

namespace :api do
  namespace :v1 do
    get "health", to: "health#show"
  end
end
```

```ruby
# app/controllers/api/v1/health_controller.rb
class Api::V1::HealthController < ApplicationController
  skip_before_action :authenticate_user!

  def show
    checks = {
      status: "ok",
      database: database_check,
      queue: queue_check,
      version: Rails.application.config.version
    }

    status = checks.values.all? { |v| v == "ok" || v.is_a?(String) } ? :ok : :service_unavailable
    render json: checks, status: status
  end

  private

  def database_check
    ActiveRecord::Base.connection.execute("SELECT 1")
    "ok"
  rescue StandardError => e
    "error: #{e.message}"
  end

  def queue_check
    SolidQueue::Process.any? ? "ok" : "no workers"
  rescue StandardError => e
    "error: #{e.message}"
  end
end
```

### Alternative: Rails Semantic Logger

For teams wanting more than Lograge, `rails_semantic_logger` is more feature-rich (structured logging, context threading, multiple outputs). However, Lograge is simpler and sufficient for GrewMe's needs.

---

## 7. Rate Limiting

**Confidence: HIGH** (Context7 verified — Rack::Attack official docs)

### Rack::Attack Setup

`rack-cors` is already in the Gemfile. Add `rack-attack`:

```ruby
# Gemfile
gem "rack-attack"
```

### Configuration

```ruby
# config/initializers/rack_attack.rb
class Rack::Attack
  ### Configure Cache ###
  # Use Rails cache (Solid Cache in production)
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

  ### Safelist ###
  # Allow all requests from localhost (health checks)
  safelist("allow-localhost") do |req|
    req.ip == "127.0.0.1" || req.ip == "::1"
  end

  ### Throttle: General API ###
  # 300 requests per 5 minutes per IP
  throttle("api/ip", limit: 300, period: 5.minutes) do |req|
    req.ip if req.path.start_with?("/api/")
  end

  ### Throttle: Login ###
  # 5 login attempts per 20 seconds per IP
  throttle("logins/ip", limit: 5, period: 20.seconds) do |req|
    if req.path == "/api/v1/auth/login" && req.post?
      req.ip
    end
  end

  # 5 login attempts per minute per email
  throttle("logins/email", limit: 5, period: 60.seconds) do |req|
    if req.path == "/api/v1/auth/login" && req.post?
      # Normalize email to prevent bypass via casing/whitespace
      req.params["email"].to_s.downcase.gsub(/\s+/, "").presence
    end
  end

  ### Throttle: Registration ###
  # 3 registrations per hour per IP
  throttle("registrations/ip", limit: 3, period: 1.hour) do |req|
    if req.path == "/api/v1/auth/register" && req.post?
      req.ip
    end
  end

  ### Blocklist: Ban persistent attackers ###
  # After 20 failed login attempts in 1 minute, ban IP for 1 hour
  blocklist("fail2ban/login") do |req|
    Rack::Attack::Allow2Ban.filter(req.ip, maxretry: 20, findtime: 1.minute, bantime: 1.hour) do
      req.path == "/api/v1/auth/login" && req.post?
    end
  end

  ### Throttled Response ###
  self.throttled_responder = lambda do |request|
    retry_after = (request.env["rack.attack.match_data"] || {})[:period]
    [
      429,
      { "Content-Type" => "application/json", "Retry-After" => retry_after.to_s },
      [{ error: "Rate limit exceeded. Retry after #{retry_after} seconds." }.to_json]
    ]
  end
end
```

### Per-User Rate Limits (After Auth)

For authenticated endpoints, throttle by user ID instead of IP:

```ruby
# Per-user API rate limit: 600 requests per 5 minutes
throttle("api/user", limit: 600, period: 5.minutes) do |req|
  if req.path.start_with?("/api/") && req.env["HTTP_AUTHORIZATION"].present?
    # Extract user from JWT (lightweight — just decode, don't verify)
    token = req.env["HTTP_AUTHORIZATION"]&.split(" ")&.last
    begin
      decoded = JWT.decode(token, nil, false).first  # decode without verification for rate limiting
      decoded["user_id"]
    rescue JWT::DecodeError
      nil
    end
  end
end
```

### Important Notes

- **Cache store:** For production with Rack::Attack, use `ActiveSupport::Cache::MemoryStore.new` (in-process, fast) or `Rails.cache` (Solid Cache). Memory store is preferred for rate limiting as it's fastest and doesn't need persistence.
- **CORS preflight:** Make sure OPTIONS requests aren't rate-limited (they're usually not since they don't match POST paths).
- **Testing:** Rack::Attack can be disabled in test environment:
```ruby
# test/test_helper.rb
Rack::Attack.enabled = false
```

---

## 8. SSL/TLS

**Confidence: HIGH** (Context7 Kamal docs + Rails guides)

### How SSL Works with Kamal 2

The SSL chain in GrewMe's stack:

```
Client (mobile app)
  → HTTPS (port 443)
    → kamal-proxy (terminates SSL via Let's Encrypt)
      → HTTP (internal, port 80)
        → Thruster (HTTP/2, compression, caching)
          → Puma (app server, port 3000)
```

**kamal-proxy** handles SSL termination and automatic certificate renewal via Let's Encrypt. **Thruster** sits inside the Docker container, wrapping Puma — it handles HTTP/2 and asset compression but does NOT do SSL (that's kamal-proxy's job).

### Required Configuration

**1. Enable SSL in `deploy.yml`:**
```yaml
proxy:
  ssl: true
  host: api.grewme.app  # Must have DNS pointing to your server
```

**2. Enable `assume_ssl` and `force_ssl` in `production.rb`:**
```ruby
# config/environments/production.rb

# Tell Rails that SSL is terminated by the reverse proxy
config.assume_ssl = true

# Force all requests to HTTPS, enable HSTS, use secure cookies
config.force_ssl = true

# Exclude health check from SSL redirect (kamal-proxy checks internally over HTTP)
config.ssl_options = { redirect: { exclude: ->(request) { request.path == "/up" } } }
```

**3. Enable host authorization:**
```ruby
# config/environments/production.rb
config.hosts = [
  "api.grewme.app",
  /.*\.grewme\.app/,  # Allow subdomains if needed
  IPAddr.new("127.0.0.1/8"),  # Allow localhost (for health checks)
]
config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
```

### HSTS (HTTP Strict Transport Security)

When `config.force_ssl = true`, Rails automatically adds the HSTS header:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains
```

This tells browsers to only use HTTPS for this domain for 2 years.

### Let's Encrypt Requirements

- Port 443 must be open on the server
- DNS A record must point to the server IP
- Only works with **single-server** Kamal deployments (which GrewMe is)
- Certificates auto-renew — no manual maintenance needed

### Cloudflare Alternative

If using Cloudflare in front of Kamal:
1. Set Cloudflare SSL mode to "Full (Strict)"
2. Still use `proxy: ssl: true` in Kamal (for origin-to-Cloudflare encryption)
3. Cloudflare handles edge SSL + CDN

For GrewMe (API-only, no CDN needs), **direct Let's Encrypt via kamal-proxy is simpler and sufficient.**

---

## 9. Database Seeding for Staging

**Confidence: MEDIUM** (standard Rails patterns + Faker gem)

### Faker Gem for Realistic Test Data

Add to `Gemfile`:
```ruby
group :development, :test do
  gem "faker"
end
```

### Seed File Structure

```ruby
# db/seeds.rb

# Skip in production unless explicitly requested
if Rails.env.production? && !ENV["FORCE_SEED"]
  puts "Skipping seeds in production. Set FORCE_SEED=1 to override."
  return
end

require "faker"

puts "Seeding database..."

# Schools
school = School.find_or_create_by!(name: "SD Negeri 1 Contoh") do |s|
  puts "  Created school: #{s.name}"
end

school2 = School.find_or_create_by!(name: "SD Harapan Bangsa") do |s|
  puts "  Created school: #{s.name}"
end

# Admin
admin = User.find_or_create_by!(email: "admin@grewme.app") do |u|
  u.name = "Admin GrewMe"
  u.password = "password123"
  u.password_confirmation = "password123"
  u.role = :admin
  puts "  Created admin: #{u.email}"
end

# Teachers
teachers = 3.times.map do |i|
  User.find_or_create_by!(email: "teacher#{i + 1}@school.example.com") do |u|
    u.name = Faker::Name.name
    u.password = "password123"
    u.password_confirmation = "password123"
    u.role = :teacher
    puts "  Created teacher: #{u.email}"
  end
end

# Classrooms
classrooms = teachers.map.with_index do |teacher, i|
  Classroom.find_or_create_by!(name: "Kelas #{i + 1}A", school: school, teacher: teacher) do |c|
    puts "  Created classroom: #{c.name}"
  end
end

# Students (5 per classroom)
students = classrooms.flat_map do |classroom|
  5.times.map do
    Student.create!(
      name: Faker::Name.first_name,
      classroom: classroom,
      avatar: nil
    )
  end
end

# Parents (1 per student, some shared)
students.each_with_index do |student, i|
  parent = User.find_or_create_by!(email: "parent#{i + 1}@parent.example.com") do |u|
    u.name = Faker::Name.name
    u.password = "password123"
    u.password_confirmation = "password123"
    u.role = :parent
  end

  ParentStudent.find_or_create_by!(parent: parent, student: student)
end

# Daily scores (last 30 school days, all 5 skills per student)
puts "  Creating daily scores..."
school_days = (30.days.ago.to_date..Date.today).select { |d| !d.saturday? && !d.sunday? }

students.each do |student|
  teacher = student.classroom.teacher
  school_days.each do |date|
    DailyScore.skill_categories.each_key do |skill|
      DailyScore.find_or_create_by!(
        student: student,
        teacher: teacher,
        date: date,
        skill_category: skill
      ) do |score|
        # Generate realistic scores with some variance
        base = rand(50..90)
        score.score = [0, [100, base + rand(-10..10)].min].max
        score.notes = rand < 0.2 ? Faker::Lorem.sentence : nil
      end
    end
  end
end

puts "Seeding complete!"
puts "  Schools: #{School.count}"
puts "  Users: #{User.count} (#{User.teacher.count} teachers, #{User.parent.count} parents, #{User.admin.count} admins)"
puts "  Classrooms: #{Classroom.count}"
puts "  Students: #{Student.count}"
puts "  Daily scores: #{DailyScore.count}"
```

### Staging Data Strategy

| Environment | Data Source | Volume |
|-------------|-----------|--------|
| Development | `db/seeds.rb` with Faker | Small (3 teachers, 15 students, 30 days) |
| Staging | Same seeds, larger scale | Medium (10 teachers, 100 students, 90 days) |
| Production | Empty — real users only | N/A |

**Use `SEED_SCALE` environment variable** to control data volume:
```ruby
scale = ENV.fetch("SEED_SCALE", "small")
teacher_count = { "small" => 3, "medium" => 10, "large" => 50 }[scale]
```

### Anonymized Production Data

For later stages, if you need production-like data:
- Use `pg_dump` from production
- Run an anonymization script that replaces PII (names, emails) with Faker-generated equivalents
- **Critical for COPPA compliance:** Never copy real student names/data to non-production environments

---

## 10. Security Hardening

**Confidence: HIGH** (Rails security guide + verified community best practices)

### Rails Production Security Checklist

#### Already Done (in current codebase)
- [x] API-only mode (no CSRF concerns for browser-based XSS)
- [x] Password hashing with bcrypt (`has_secure_password`)
- [x] Brakeman security scanning in CI
- [x] Bundler Audit for known gem vulnerabilities
- [x] Non-root Docker user in Dockerfile
- [x] jemalloc for memory safety

#### Must Do Before Production
- [ ] **Uncomment `force_ssl` and `assume_ssl`** in `production.rb`
- [ ] **Enable host authorization** with production domain
- [ ] **Remove hardcoded JWT fallback secret** (`"dev-secret-key"` in JwtService)
- [ ] **Fix role escalation bug** (remove `:role` from registration params)
- [ ] **Enable CORS** with specific allowed origins
- [ ] **Add Rack::Attack** rate limiting
- [ ] **Add strong_migrations** gem
- [ ] **Add password minimum length** validation (8+ characters)
- [ ] **Set `android:allowBackup="false"`** in both Android manifests
- [ ] **Configure `config.hosts`** in production

#### Content Security Policy for API

Since GrewMe is API-only (no HTML views), a strict CSP is simple:

```ruby
# config/initializers/content_security_policy.rb
Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :none
    policy.frame_ancestors :none
  end

  # Don't use nonce generation for API-only apps
  config.content_security_policy_nonce_generator = nil
end
```

This blocks any attempt to embed the API in frames and prevents any resource loading — appropriate for a pure JSON API.

#### Parameter Filtering

Ensure sensitive parameters are filtered from logs:

```ruby
# config/initializers/filter_parameter_logging.rb
Rails.application.config.filter_parameters += [
  :password,
  :password_confirmation,
  :password_digest,
  :token,
  :secret,
  :_key,
  :authorization,
  :email,  # PII
  :name,   # PII (especially for children's data)
]
```

#### Security Headers

Add to `ApplicationController` or as middleware:

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::API
  include Authenticatable

  before_action :authenticate_user!
  after_action :set_security_headers

  private

  def set_security_headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
  end
end
```

#### CORS Configuration

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # In production, restrict to known origins
    # Mobile apps don't send Origin headers for API calls,
    # but this protects against browser-based abuse
    origins ENV.fetch("ALLOWED_ORIGINS", "*").split(",")

    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options],
      expose: ["Authorization"],
      max_age: 600
  end
end
```

#### Credential Management

```bash
# Edit production credentials
EDITOR="code --wait" bin/rails credentials:edit --environment production

# Store in credentials:
# sentry:
#   dsn: https://xxx@sentry.io/yyy
# smtp:
#   user_name: xxx
#   password: yyy
```

---

## 11. Recommended Implementation Order

### Phase 1: Foundation (Before First Deploy)

1. **Fix critical security bugs** — Remove JWT fallback secret, fix role escalation
2. **Enable SSL configuration** — `force_ssl`, `assume_ssl`, host authorization
3. **Add strong_migrations** — Prevent unsafe schema changes going forward
4. **Fix test fixtures + write P0 tests** — Auth flow must be tested
5. **Add SimpleCov** — Establish coverage baseline

### Phase 2: CI/CD Pipeline (Weeks 1-2)

6. **Set up production server** — VPS + DNS + actual deploy.yml
7. **Configure Kamal for real deployment** — Registry, secrets, accessories
8. **Add Rack::Attack** — Rate limiting before going public
9. **Add Lograge** — Structured logging for production debugging
10. **Add error tracking** — Sentry or Honeybadger

### Phase 3: Mobile CI (Weeks 2-3)

11. **Create mobile CI workflow** — Composite action + matrix builds
12. **Set up Fastlane for Android** — Signing + internal testing track
13. **Set up Fastlane for iOS** — Match + TestFlight

### Phase 4: Operational Excellence (Weeks 3-4)

14. **Database backup automation** — Cron + off-site sync
15. **Seed data for staging** — Faker-based realistic data
16. **Health check endpoint** — Beyond `/up`, with DB/queue checks
17. **Coverage threshold enforcement** — Ramp to 80%+

### Phase ordering rationale

- Security fixes **must** come before any deployment (foundational)
- SSL/host auth **must** be configured before Kamal deploy (can't deploy insecurely)
- Tests **must** exist before coverage thresholds make sense
- Mobile CI depends on backend being stable (backend first)
- Operational tooling (backups, monitoring) can follow initial deploy but should be in place before any real users

---

## Sources

### Context7 (HIGH confidence)
- Kamal 2 deployment docs — `/basecamp/kamal-site`
- Rack::Attack configuration — `/rack/rack-attack`
- strong_migrations — `/ankane/strong_migrations`
- Sentry Ruby SDK — `/getsentry/sentry-ruby`
- Fastlane docs — `/websites/fastlane_tools`

### Official Documentation (HIGH confidence)
- [Kotlin Multiplatform CI Guide](https://kotlinlang.org/docs/multiplatform/kmp-ci-tutorial.html) — Official JetBrains docs
- [PostgreSQL Backup & Restore](https://www.postgresql.org/docs/17/backup.html) — Official PostgreSQL 17 docs
- [Rails Security Guide](https://guides.rubyonrails.org/security.html) — Official Rails guides

### Verified Community Sources (MEDIUM confidence)
- [CI/CD for KMP 2025](https://www.kmpship.app/blog/ci-cd-kotlin-multiplatform-2025) — Comprehensive KMP CI/CD guide
- [Full SSL from Cloudflare to Rails with Kamal](https://www.fromthekeyboard.com/full-ssl-from-cloudflare-to-your-rails-app-with-kamal/) — Practical SSL guide
- [Thruster vs Kamal-proxy guide](https://testdouble.com/insights/thruster-vs-kamal-proxy-guide) — TestDouble engineering blog
- [SimpleCov Rails 8 setup](https://railsdrop.com/2025/05/05/rails-8-adding-simplecov-brakeman-for-ci-cd/) — Rails 8 specific guide
- [PgBouncer connection pooling](https://querysharp.com/blog/database-dying-too-many-handshakes-pgbouncer-guide) — Production PgBouncer guide
- [Rails Security Best Practices 2025](https://blog.railsforgedev.com/rails-security-guide-best-practices-2025) — RailsForge security guide
- [Honeybadger Kamal integration](https://docs.honeybadger.io/lib/ruby/integration-guides/rails-exception-tracking) — Official Honeybadger docs
- [Kamal 2.0 Complete Guide](https://jetthoughts.com/blog/kamal-2.0-complete-rails-deployment-guide-deploy-without-heroku-in-2025/) — JetThoughts deployment guide
