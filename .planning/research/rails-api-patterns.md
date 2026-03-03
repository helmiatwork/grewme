# Rails 8 API Backend Patterns for GrewMe

**Researched:** 2026-03-04
**Confidence:** HIGH (Context7 + official docs + multiple verified sources)
**Context:** Rails 8.1.2 API-only, PostgreSQL, JWT auth, serving two KMP mobile apps (teacher + parent). Children's education data = COPPA applies.

---

## 1. JSON Serialization

### Recommendation: **Alba** (gem `alba`)

**Why Alba over alternatives:**

| Serializer | Status | Speed | DX | Verdict |
|------------|--------|-------|-----|---------|
| **Alba** | Active, maintained | Fastest pure-Ruby serializer | Clean DSL, zero dependencies | **Use this** |
| jbuilder | Rails-bundled | Slowest (template-based) | Familiar but verbose | Too slow for API-only |
| jsonapi-serializer | Maintained (Netflix fork) | Fast | JSON:API spec compliance | Overkill — KMP clients don't need JSON:API |
| ActiveModel::Serializers | **Archived/dead** | Decent w/ caching | Legacy | Do not use |

**Confidence: HIGH** — Alba benchmarks verified via multiple sources (Cookpad benchmarks, "Escaping the AMS Trap" Jan 2026). Alba is 2-3x faster than AMS, dependency-free, and actively maintained.

**Alba resource pattern for GrewMe:**

```ruby
# app/resources/user_resource.rb
class UserResource
  include Alba::Resource

  root_key :user

  attributes :id, :name, :email, :role
end

# app/resources/student_resource.rb
class StudentResource
  include Alba::Resource

  root_key :student

  attributes :id, :name, :avatar
  one :classroom, resource: ClassroomResource
end

# app/resources/radar_data_resource.rb
class RadarDataResource
  include Alba::Resource

  root_key :radar

  attributes :student_id, :student_name
  attribute :skills do
    # Return aggregated skill scores as hash
    {
      reading: object.avg_reading,
      math: object.avg_math,
      writing: object.avg_writing,
      logic: object.avg_logic,
      social: object.avg_social
    }
  end
  attribute :period do
    object.period_label
  end
end
```

**Gemfile addition:**
```ruby
gem "alba"
```

**Key Alba features for GrewMe:**
- `one` / `many` macros for associations (classroom → students, student → scores)
- `nested_attribute` for structuring radar chart data without extra models
- Conditional attributes via blocks (show different fields for teacher vs parent)
- Root key control for consistent JSON envelope

---

## 2. API Versioning

### Recommendation: **Path-based namespacing** (already scaffolded as `Api::V1`)

The current `Api::V1` module namespace is the right pattern. Path-based versioning (`/api/v1/...`) is the most pragmatic choice for mobile apps because:
- Mobile clients hardcode base URLs — path versioning is explicit
- Simpler than header-based for KMP Ktor clients
- Already partially in place in the codebase

**Confidence: HIGH** — This is the dominant Rails API versioning pattern (verified via multiple 2025-2026 sources).

**Routes pattern (currently missing — routes.rb is empty):**

```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Auth
      post "auth/login", to: "auth#login"
      post "auth/register", to: "auth#register"
      post "auth/refresh", to: "auth#refresh"

      # Teacher endpoints
      resources :classrooms, only: [:index, :show] do
        resources :students, only: [:index], module: :classrooms
        get :overview, on: :member
      end

      # Score management
      resources :daily_scores, only: [:create, :update]
      post "daily_scores/batch", to: "daily_scores#batch_create"

      # Student data (shared by teacher + parent, scoped by authorization)
      resources :students, only: [:show] do
        get :radar, on: :member
        get :progress, on: :member
        resources :daily_scores, only: [:index], module: :students
      end

      # Parent endpoints
      namespace :parents do
        resources :children, only: [:index]
      end

      # Account management (COPPA)
      resource :account, only: [:show, :destroy]
      namespace :account do
        post :export_data
      end
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
```

---

## 3. Standardized Error Handling

### Recommendation: **`rescue_from` in base controller + custom error module**

**Confidence: HIGH** — Standard Rails pattern, verified via Rails guides and multiple production sources.

```ruby
# lib/api_error.rb
module ApiError
  class Base < StandardError
    attr_reader :status, :code

    def initialize(message = nil, status: :internal_server_error, code: nil)
      @status = status
      @code = code || self.class.name.demodulize.underscore
      super(message || "An error occurred")
    end
  end

  class NotFound < Base
    def initialize(message = "Resource not found")
      super(message, status: :not_found)
    end
  end

  class Forbidden < Base
    def initialize(message = "You don't have permission to access this resource")
      super(message, status: :forbidden)
    end
  end

  class Unauthorized < Base
    def initialize(message = "Authentication required")
      super(message, status: :unauthorized)
    end
  end

  class RateLimited < Base
    def initialize(message = "Too many requests. Please try again later.")
      super(message, status: :too_many_requests, code: "rate_limited")
    end
  end
end

# app/controllers/api/v1/base_controller.rb
module Api
  module V1
    class BaseController < ApplicationController
      include Authenticatable

      before_action :authenticate_user!

      rescue_from ApiError::Base do |e|
        render json: { error: { code: e.code, message: e.message } }, status: e.status
      end

      rescue_from ActiveRecord::RecordNotFound do |e|
        render json: { error: { code: "not_found", message: "#{e.model} not found" } }, status: :not_found
      end

      rescue_from ActiveRecord::RecordInvalid do |e|
        render json: { error: { code: "validation_failed", message: e.message, details: e.record.errors } }, status: :unprocessable_entity
      end

      rescue_from ActionController::ParameterMissing do |e|
        render json: { error: { code: "missing_parameter", message: e.message } }, status: :bad_request
      end

      private

      def render_error(message, status: :unprocessable_entity, code: nil)
        render json: { error: { code: code || status.to_s, message: message } }, status: status
      end
    end
  end
end
```

**Standardized JSON error shape:**
```json
{
  "error": {
    "code": "validation_failed",
    "message": "Score must be between 0 and 100",
    "details": { "score": ["must be less than or equal to 100"] }
  }
}
```

---

## 4. JWT Authentication (Fixing Current Issues)

### Current problems in `JwtService`:
1. **Hardcoded fallback secret** `"dev-secret-key"` — token forgery risk
2. **No refresh token** — users forced to re-login every 24h
3. **No token revocation** — can't invalidate compromised tokens
4. **Role in JWT payload** — stale role if changed server-side

### Recommendation: **Keep `jwt` gem, fix architecture**

**Confidence: HIGH** — JWT patterns verified from multiple 2025-2026 sources; Rails credentials system is official.

**A. Secure Secret Management:**

```ruby
# app/services/jwt_service.rb
class JwtService
  ALGORITHM = "HS256"
  ACCESS_TOKEN_EXPIRY = 15.minutes
  REFRESH_TOKEN_EXPIRY = 7.days

  class << self
    def encode(payload, exp: ACCESS_TOKEN_EXPIRY.from_now)
      payload[:exp] = exp.to_i
      payload[:iat] = Time.current.to_i
      payload[:jti] = SecureRandom.uuid # Unique token ID for revocation
      JWT.encode(payload, secret_key, ALGORITHM)
    end

    def decode(token)
      decoded = JWT.decode(token, secret_key, true, algorithm: ALGORITHM)
      payload = HashWithIndifferentAccess.new(decoded.first)

      # Check if token has been revoked
      raise JWT::DecodeError, "Token revoked" if token_revoked?(payload[:jti])

      payload
    rescue JWT::DecodeError, JWT::ExpiredSignature => e
      Rails.logger.warn("JWT decode error: #{e.message}")
      nil
    end

    private

    def secret_key
      # NO FALLBACK. Fail loud if secret is missing.
      Rails.application.credentials.secret_key_base ||
        raise("SECRET_KEY_BASE not configured. Run `rails credentials:edit`")
    end

    def token_revoked?(jti)
      return false if jti.blank?
      Rails.cache.exist?("revoked_jwt:#{jti}")
    end
  end
end
```

**Critical fix:** Remove `ENV.fetch("SECRET_KEY_BASE", "dev-secret-key")`. The fallback allows token forgery. Use `Rails.application.credentials.secret_key_base` only, and FAIL if it's missing.

**B. Refresh Token Pattern (database-backed):**

```ruby
# Migration: create_refresh_tokens
class CreateRefreshTokens < ActiveRecord::Migration[8.1]
  def change
    create_table :refresh_tokens do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token_digest, null: false, index: { unique: true }
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.string :ip_address
      t.string :user_agent
      t.timestamps
    end

    add_index :refresh_tokens, :expires_at
    add_index :refresh_tokens, [:user_id, :revoked_at]
  end
end

# app/models/refresh_token.rb
class RefreshToken < ApplicationRecord
  belongs_to :user

  before_create :generate_token

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  def revoke!
    update!(revoked_at: Time.current)
  end

  def expired?
    expires_at < Time.current
  end

  def revoked?
    revoked_at.present?
  end

  private

  attr_accessor :raw_token

  def generate_token
    self.raw_token = SecureRandom.urlsafe_base64(32)
    self.token_digest = Digest::SHA256.hexdigest(raw_token)
    self.expires_at ||= 7.days.from_now
  end
end
```

**C. Token Revocation Strategy:**

Use a **cache-based blocklist for access tokens** (short-lived, only need to block until expiry) + **database revocation for refresh tokens** (long-lived):

```ruby
# Revoke access token (store JTI in cache until token would have expired)
def self.revoke_access_token(jti, exp)
  ttl = [exp - Time.current.to_i, 0].max
  Rails.cache.write("revoked_jwt:#{jti}", true, expires_in: ttl.seconds) if ttl > 0
end

# Revoke all refresh tokens for a user (e.g., password change, account compromise)
def self.revoke_all_for_user(user)
  user.refresh_tokens.active.update_all(revoked_at: Time.current)
end
```

**D. Fix role escalation vulnerability:**

```ruby
# In auth_controller.rb register action — NEVER accept role from params
def register_params
  params.permit(:name, :email, :password, :password_confirmation)
  # role defaults to :teacher via the enum default
  # Admin role assigned only by existing admins via a separate endpoint
end
```

**Token flow for KMP mobile apps:**
1. Login → returns `{ access_token: "...", refresh_token: "...", expires_in: 900 }`
2. Access token (15 min) used for all API calls in `Authorization: Bearer <token>`
3. When access token expires → POST `/api/v1/auth/refresh` with refresh_token
4. Server validates refresh token, issues new access + refresh token pair (rotation)
5. Old refresh token is revoked immediately (detect reuse = compromise)

---

## 5. Authorization

### Recommendation: **Pundit**

**Why Pundit over alternatives:**

| Gem | Pattern | Fits GrewMe? | Notes |
|-----|---------|-------------|-------|
| **Pundit** | Plain Ruby policy objects | **Yes** | Simple, testable, supports scopes, namespacing |
| CanCanCan | DSL-based ability file | Partial | Single-file abilities get complex with resource scoping |
| Custom | `authorize_role!` method | No | Already in codebase but too simplistic — no resource scoping |

**Confidence: HIGH** — Pundit docs verified via Context7. It perfectly fits GrewMe's two-dimensional auth: role-based (teacher/parent/admin) + resource-scoped (my classrooms, my children).

**Pundit policies for GrewMe:**

```ruby
# app/policies/application_policy.rb
class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def admin?
    user.admin?
  end
end

# app/policies/classroom_policy.rb
class ClassroomPolicy < ApplicationPolicy
  def index?
    user.teacher? || user.admin?
  end

  def show?
    user.admin? || owns_classroom?
  end

  def overview?
    show?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.teacher?
        scope.where(teacher_id: user.id)
      else
        scope.none
      end
    end
  end

  private

  def owns_classroom?
    user.teacher? && record.teacher_id == user.id
  end
end

# app/policies/student_policy.rb
class StudentPolicy < ApplicationPolicy
  def show?
    user.admin? || teaches_student? || parents_student?
  end

  def radar?
    show?
  end

  def progress?
    show?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.teacher?
        scope.joins(:classroom).where(classrooms: { teacher_id: user.id })
      elsif user.parent?
        scope.joins(:parent_students).where(parent_students: { parent_id: user.id })
      else
        scope.none
      end
    end
  end

  private

  def teaches_student?
    user.teacher? && record.classroom.teacher_id == user.id
  end

  def parents_student?
    user.parent? && user.children.include?(record)
  end
end

# app/policies/daily_score_policy.rb
class DailyScorePolicy < ApplicationPolicy
  def create?
    user.teacher? || user.admin?
  end

  def update?
    user.admin? || (user.teacher? && record.teacher_id == user.id)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.teacher?
        scope.where(teacher_id: user.id)
      elsif user.parent?
        scope.joins(student: :parent_students)
             .where(parent_students: { parent_id: user.id })
      else
        scope.none
      end
    end
  end
end
```

**Controller integration:**
```ruby
class Api::V1::ClassroomsController < Api::V1::BaseController
  def index
    @classrooms = policy_scope(Classroom).includes(:students)
    render json: ClassroomResource.new(@classrooms).serialize
  end

  def show
    @classroom = Classroom.find(params[:id])
    authorize @classroom
    render json: ClassroomResource.new(@classroom).serialize
  end
end
```

**Gemfile addition:**
```ruby
gem "pundit"
```

---

## 6. Testing Rails APIs

### Recommendation: **Minitest (built-in) + fixtures + custom auth helpers**

**Why not RSpec:** The project already uses Minitest (Rails default). Switching to RSpec adds a dependency and learning curve for no gain. Minitest is simpler, faster, and the Rails team tests Rails itself with Minitest.

**Confidence: HIGH** — Verified via Rails testing guides.

**A. Auth test helper:**

```ruby
# test/test_helper.rb
module AuthTestHelper
  def auth_headers(user)
    token = JwtService.encode(user_id: user.id)
    { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" }
  end

  def auth_post(path, user:, params: {})
    post path, params: params.to_json, headers: auth_headers(user)
  end

  def auth_get(path, user:, params: {})
    get path, params: params, headers: auth_headers(user)
  end

  def auth_put(path, user:, params: {})
    put path, params: params.to_json, headers: auth_headers(user)
  end

  def auth_delete(path, user:)
    delete path, headers: auth_headers(user)
  end
end

class ActionDispatch::IntegrationTest
  include AuthTestHelper
end
```

**B. Fixture strategy (not factories):**

Fixtures are the Rails-idiomatic choice. They're fast (loaded once per test run via transactions), and sufficient for GrewMe's simple domain model.

```yaml
# test/fixtures/users.yml
teacher_alice:
  name: Alice Teacher
  email: alice@school.test
  password_digest: <%= BCrypt::Password.create("password123") %>
  role: 0  # teacher

teacher_bob:
  name: Bob Teacher
  email: bob@school.test
  password_digest: <%= BCrypt::Password.create("password123") %>
  role: 0

parent_carol:
  name: Carol Parent
  email: carol@parent.test
  password_digest: <%= BCrypt::Password.create("password123") %>
  role: 1  # parent

admin_dave:
  name: Dave Admin
  email: dave@admin.test
  password_digest: <%= BCrypt::Password.create("password123") %>
  role: 2  # admin

# test/fixtures/schools.yml
greenwood:
  name: Greenwood Elementary

# test/fixtures/classrooms.yml
alice_class:
  name: "Alice's Class 1A"
  school: greenwood
  teacher: teacher_alice

bob_class:
  name: "Bob's Class 2B"
  school: greenwood
  teacher: teacher_bob

# test/fixtures/students.yml
student_emma:
  name: Emma
  classroom: alice_class

student_finn:
  name: Finn
  classroom: alice_class

student_grace:
  name: Grace
  classroom: bob_class

# test/fixtures/parent_students.yml
carol_emma:
  parent: parent_carol
  student: student_emma
```

**C. Integration test patterns:**

```ruby
# test/controllers/api/v1/classrooms_controller_test.rb
class Api::V1::ClassroomsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @teacher = users(:teacher_alice)
    @other_teacher = users(:teacher_bob)
    @parent = users(:parent_carol)
  end

  test "teacher sees only their classrooms" do
    auth_get api_v1_classrooms_path, user: @teacher

    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 1, json["classrooms"].length
    assert_equal classrooms(:alice_class).id, json["classrooms"].first["id"]
  end

  test "teacher cannot see another teacher's classroom" do
    auth_get api_v1_classroom_path(classrooms(:bob_class)), user: @teacher

    assert_response :forbidden
  end

  test "parent cannot access classrooms" do
    auth_get api_v1_classrooms_path, user: @parent

    assert_response :forbidden
  end

  test "unauthenticated request returns 401" do
    get api_v1_classrooms_path

    assert_response :unauthorized
  end
end

# test/controllers/api/v1/daily_scores_controller_test.rb
class Api::V1::DailyScoresControllerTest < ActionDispatch::IntegrationTest
  test "teacher submits daily scores for their student" do
    teacher = users(:teacher_alice)
    student = students(:student_emma)

    auth_post api_v1_daily_scores_path, user: teacher, params: {
      daily_score: {
        student_id: student.id,
        date: Date.current.to_s,
        skill_category: "reading",
        score: 85,
        notes: "Great improvement"
      }
    }

    assert_response :created
    assert_equal 85, DailyScore.last.score
  end

  test "teacher cannot submit scores for another teacher's student" do
    teacher = users(:teacher_alice)
    student = students(:student_grace) # belongs to bob's class

    auth_post api_v1_daily_scores_path, user: teacher, params: {
      daily_score: {
        student_id: student.id,
        date: Date.current.to_s,
        skill_category: "reading",
        score: 85
      }
    }

    assert_response :forbidden
  end

  test "score must be between 0 and 100" do
    teacher = users(:teacher_alice)
    student = students(:student_emma)

    auth_post api_v1_daily_scores_path, user: teacher, params: {
      daily_score: {
        student_id: student.id,
        date: Date.current.to_s,
        skill_category: "reading",
        score: 150
      }
    }

    assert_response :unprocessable_entity
  end
end
```

**Test priority order:**
1. Auth flow (login, register, refresh, token expiry)
2. Authorization scoping (teacher sees own, parent sees own, cross-access blocked)
3. Score CRUD (create, update, validation, batch)
4. Radar data endpoint (aggregation correctness)
5. COPPA endpoints (data export, account deletion)

---

## 7. Performance

### A. Materialized Views for Radar Data

**Recommendation: Use the `scenic` gem** for PostgreSQL materialized views.

**Confidence: HIGH** — Scenic is the standard Rails gem for database views (verified via web search, production case study showing 9000x speedup). Materialized views are ideal for GrewMe's radar chart data because:
- Radar data = aggregated averages across 5 skills per student per time period
- Data changes at most once daily (when teacher inputs scores)
- Query is expensive (GROUP BY + AVG across many rows)
- Staleness of 5-60 minutes is perfectly acceptable for parents viewing charts

```sql
-- db/views/student_radar_summaries_v01.sql
SELECT
  s.id AS student_id,
  s.name AS student_name,
  s.classroom_id,
  AVG(CASE WHEN ds.skill_category = 0 THEN ds.score END) AS avg_reading,
  AVG(CASE WHEN ds.skill_category = 1 THEN ds.score END) AS avg_math,
  AVG(CASE WHEN ds.skill_category = 2 THEN ds.score END) AS avg_writing,
  AVG(CASE WHEN ds.skill_category = 3 THEN ds.score END) AS avg_logic,
  AVG(CASE WHEN ds.skill_category = 4 THEN ds.score END) AS avg_social,
  COUNT(DISTINCT ds.date) AS total_days_scored,
  MIN(ds.date) AS first_score_date,
  MAX(ds.date) AS last_score_date
FROM students s
LEFT JOIN daily_scores ds ON ds.student_id = s.id
GROUP BY s.id, s.name, s.classroom_id;
```

```ruby
# Migration
class CreateStudentRadarSummaries < ActiveRecord::Migration[8.1]
  def change
    create_view :student_radar_summaries, materialized: true

    # Add index for fast lookups
    add_index :student_radar_summaries, :student_id, unique: true
    add_index :student_radar_summaries, :classroom_id
  end
end

# app/models/student_radar_summary.rb
class StudentRadarSummary < ApplicationRecord
  self.primary_key = :student_id

  belongs_to :student
  belongs_to :classroom

  def self.refresh
    Scenic.database.refresh_materialized_view(table_name, concurrently: true, cascade: false)
  end

  def readonly?
    true
  end
end
```

**Refresh strategy:** Use Solid Queue to refresh materialized view after daily score submission:

```ruby
# app/jobs/refresh_radar_summary_job.rb
class RefreshRadarSummaryJob < ApplicationJob
  queue_as :default

  def perform
    StudentRadarSummary.refresh
  end
end

# Trigger after score creation/update
class DailyScore < ApplicationRecord
  after_commit :schedule_radar_refresh, on: [:create, :update]

  private

  def schedule_radar_refresh
    # Debounce: only refresh once per minute (batch score submissions)
    RefreshRadarSummaryJob.set(wait: 1.minute).perform_later
  end
end
```

**Gemfile addition:**
```ruby
gem "scenic"
```

### B. N+1 Prevention

**Use Rails' built-in `strict_loading`** — no need for the Bullet gem.

```ruby
# config/environments/development.rb
# Raise on N+1 queries in development
config.active_record.strict_loading_by_default = true

# Or per-model for critical associations:
class Student < ApplicationRecord
  has_many :daily_scores, strict_loading: true
  belongs_to :classroom, strict_loading: true
end
```

**Eager loading in controllers:**
```ruby
# Classroom overview — load students and their latest radar data
def overview
  @classroom = Classroom.find(params[:id])
  authorize @classroom

  @summaries = StudentRadarSummary
    .where(classroom_id: @classroom.id)
    .includes(:student)

  render json: ClassroomOverviewResource.new(@summaries).serialize
end
```

### C. Caching with Solid Cache

Solid Cache is already in the Gemfile. Use it for:

```ruby
# Cache individual radar data (invalidate on score update)
def radar
  @student = Student.find(params[:id])
  authorize @student

  radar_data = Rails.cache.fetch("radar:#{@student.id}", expires_in: 10.minutes) do
    StudentRadarSummary.find_by(student_id: @student.id)
  end

  render json: RadarDataResource.new(radar_data).serialize
end

# Invalidate cache when scores change
class DailyScore < ApplicationRecord
  after_commit :invalidate_radar_cache, on: [:create, :update, :destroy]

  private

  def invalidate_radar_cache
    Rails.cache.delete("radar:#{student_id}")
  end
end
```

---

## 8. Security for Children's Data (COPPA)

### COPPA Requirements That Apply to GrewMe

**Confidence: MEDIUM-HIGH** — COPPA requirements verified via FTC guidelines and multiple 2025-2026 compliance sources. Full compliance required by April 22, 2026 for updated rules.

GrewMe stores data **about** children (students aged ~5-12) collected by teachers and viewed by parents. This falls under COPPA because:
- Student names, scores, and behavioral assessments are personal information
- Parents must be able to access, review, and delete their children's data
- Data collection must be limited to what's reasonably necessary

**Required endpoints/features:**

| COPPA Requirement | Implementation |
|-------------------|----------------|
| Parental access to child's data | `GET /api/v1/students/:id/export` — returns all data for that child |
| Parental deletion request | `DELETE /api/v1/account` — soft-delete + queue hard-delete after 30 days |
| Data minimization | Only collect scores (0-100), skill category, date, optional notes |
| Reasonable security | JWT (fixed), role-based auth, encryption, rate limiting |
| Audit logging | Track who accessed which student's data |

### A. Rate Limiting with Rack::Attack

**Confidence: HIGH** — Verified via Context7 (Rack::Attack official docs).

```ruby
# Gemfile
gem "rack-attack"

# config/initializers/rack_attack.rb
class Rack::Attack
  # Throttle login attempts by IP
  throttle("auth/ip", limit: 5, period: 20.seconds) do |req|
    if req.path.match?(%r{/api/v1/auth/login}) && req.post?
      req.ip
    end
  end

  # Throttle login attempts by email
  throttle("auth/email", limit: 6, period: 60.seconds) do |req|
    if req.path.match?(%r{/api/v1/auth/login}) && req.post?
      req.params.dig("email")&.downcase&.strip
    end
  end

  # Throttle API requests by authenticated user (general)
  throttle("api/user", limit: 120, period: 60.seconds) do |req|
    if req.path.start_with?("/api/")
      # Extract user_id from JWT if present
      token = req.env["HTTP_AUTHORIZATION"]&.split(" ")&.last
      payload = JwtService.decode(token) rescue nil
      payload&.dig(:user_id)&.to_s
    end
  end

  # Throttle registration to prevent abuse
  throttle("auth/register/ip", limit: 3, period: 1.hour) do |req|
    if req.path.match?(%r{/api/v1/auth/register}) && req.post?
      req.ip
    end
  end

  # Block requests with no User-Agent (bots)
  blocklist("no-user-agent") do |req|
    req.user_agent.blank? && req.path.start_with?("/api/")
  end

  # Custom response for throttled requests
  self.throttled_responder = lambda do |req|
    [429, { "Content-Type" => "application/json" },
     [{ error: { code: "rate_limited", message: "Too many requests. Try again later." } }.to_json]]
  end
end
```

### B. Audit Logging

**Recommendation: PaperTrail** for model versioning + custom access logging concern.

**Why PaperTrail over Logidze:**
- PaperTrail: Ruby-level, works with any DB, simpler setup, 6.9k GitHub stars, actively maintained
- Logidze: PostgreSQL-specific triggers, faster but more complex to set up, stores in JSONB on the record itself
- For COPPA audit trails, PaperTrail's separate `versions` table is better for compliance reporting

```ruby
# Gemfile
gem "paper_trail"

# On models that store children's data:
class DailyScore < ApplicationRecord
  has_paper_trail

  # PaperTrail automatically tracks who changed what when
end

class Student < ApplicationRecord
  has_paper_trail
end

class ParentStudent < ApplicationRecord
  has_paper_trail
end
```

**Custom access logging for COPPA (who viewed student data):**

```ruby
# app/controllers/concerns/audit_loggable.rb
module AuditLoggable
  extend ActiveSupport::Concern

  private

  def log_student_access(student, action = "view")
    AuditLog.create!(
      user: current_user,
      action: action,
      resource_type: "Student",
      resource_id: student.id,
      ip_address: request.remote_ip,
      user_agent: request.user_agent,
      metadata: { endpoint: request.fullpath }
    )
  end
end

# Migration for audit_logs table
class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.string :action, null: false
      t.string :resource_type, null: false
      t.bigint :resource_id, null: false
      t.string :ip_address
      t.string :user_agent
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :audit_logs, [:resource_type, :resource_id]
    add_index :audit_logs, :created_at
    add_index :audit_logs, :user_id
  end
end
```

### C. Data Export & Deletion (COPPA endpoints)

```ruby
# app/controllers/api/v1/accounts_controller.rb
module Api
  module V1
    class AccountsController < BaseController
      # GET /api/v1/account
      def show
        render json: UserResource.new(current_user).serialize
      end

      # DELETE /api/v1/account
      def destroy
        # Soft-delete: schedule hard delete after 30-day grace period
        current_user.update!(scheduled_deletion_at: 30.days.from_now)
        # Revoke all tokens immediately
        current_user.refresh_tokens.active.update_all(revoked_at: Time.current)
        # Queue hard deletion job
        AccountDeletionJob.set(wait: 30.days).perform_later(current_user.id)

        render json: { message: "Account scheduled for deletion in 30 days" }
      end
    end
  end
end

# POST /api/v1/account/export_data
module Api
  module V1
    module Account
      class ExportDataController < BaseController
        def create
          DataExportJob.perform_later(current_user.id)
          render json: { message: "Data export initiated. You'll receive a download link." }
        end
      end
    end
  end
end
```

### D. Encryption at Rest

PostgreSQL supports Transparent Data Encryption (TDE) at the storage level. For application-level encryption of sensitive fields:

```ruby
# For sensitive notes on daily scores
class DailyScore < ApplicationRecord
  encrypts :notes  # Rails 7+ built-in ActiveRecord encryption
end
```

Add to credentials:
```yaml
active_record_encryption:
  primary_key: <generated>
  deterministic_key: <generated>
  key_derivation_salt: <generated>
```

---

## 9. Solid Queue / Solid Cache / Solid Cable

### Already in Gemfile. Configuration needed:

**Confidence: HIGH** — Verified via Context7 (Rails 8.1.2 guides), production usage reports from 2025-2026.

### A. Solid Queue (Background Jobs)

Already configured in production. Enable for development too:

```ruby
# config/environments/development.rb
config.active_job.queue_adapter = :solid_queue
config.solid_queue.connects_to = { database: { writing: :queue } }
```

```yaml
# config/queue.yml (or config/solid_queue.yml)
default: &default
  dispatchers:
    - polling_interval: 1
      batch_size: 500
  workers:
    - queues: "*"
      threads: 3
      processes: <%= ENV.fetch("JOB_CONCURRENCY", 1) %>
      polling_interval: 0.1

development:
  <<: *default

production:
  <<: *default
  workers:
    - queues: "default,mailers"
      threads: 5
      processes: <%= ENV.fetch("JOB_CONCURRENCY", 2) %>
      polling_interval: 0.1
```

**Jobs for GrewMe:**

| Job | Trigger | Purpose |
|-----|---------|---------|
| `RefreshRadarSummaryJob` | After score create/update (debounced) | Refresh materialized view |
| `DataExportJob` | Parent requests data export | Generate CSV/JSON of child's data |
| `AccountDeletionJob` | 30 days after account deletion request | Hard-delete user + associated data |
| `AuditLogCleanupJob` | Recurring (monthly) | Purge audit logs older than retention period |

**Recurring jobs (cron-like):**

```yaml
# config/recurring.yml
production:
  audit_log_cleanup:
    class: AuditLogCleanupJob
    queue: default
    schedule: every month

  radar_full_refresh:
    class: RefreshRadarSummaryJob
    queue: default
    schedule: every day at 2am
```

### B. Solid Cache

Already configured. Key usage patterns:

```ruby
# config/environments/production.rb
config.cache_store = :solid_cache_store

# Cache patterns:
# 1. Radar data per student (invalidate on score change)
Rails.cache.fetch("radar:#{student_id}", expires_in: 10.minutes) { ... }

# 2. Classroom overview (invalidate when any score in classroom changes)
Rails.cache.fetch("classroom_overview:#{classroom_id}", expires_in: 15.minutes) { ... }

# 3. User profile data (rarely changes)
Rails.cache.fetch("user:#{user_id}", expires_in: 1.hour) { ... }
```

### C. Solid Cable (Real-time Updates)

Use for notifying parent apps when new scores are submitted:

```ruby
# app/channels/student_channel.rb
class StudentChannel < ApplicationCable::Channel
  def subscribed
    student = Student.find(params[:student_id])
    # Verify parent/teacher has access to this student
    if authorized_for_student?(student)
      stream_for student
    else
      reject
    end
  end
end

# After score submission, broadcast to parent
class DailyScore < ApplicationRecord
  after_commit :notify_parents, on: :create

  private

  def notify_parents
    StudentChannel.broadcast_to(student, {
      type: "new_score",
      date: date.to_s,
      skill: skill_category
    })
  end
end
```

**Note:** Real-time updates are a Phase 4 "polish" feature. Don't block MVP on this. The mobile apps can poll `/radar` endpoint initially.

---

## 10. Complete Gem List

```ruby
# Gemfile additions (beyond what's already there)
gem "alba"              # JSON serialization
gem "pundit"            # Authorization
gem "rack-attack"       # Rate limiting
gem "paper_trail"       # Audit trail for COPPA
gem "scenic"            # PostgreSQL materialized views

# Already present (keep):
gem "jwt"               # JWT tokens
gem "bcrypt"            # Password hashing
gem "rack-cors"         # CORS for mobile apps
gem "solid_queue"       # Background jobs
gem "solid_cache"       # Caching
gem "solid_cable"       # WebSocket/real-time
```

---

## 11. Implementation Priority

Based on the current codebase state (routes not wired, auth chain broken, zero tests, security issues):

### Phase 1: Fix Security & Wire Routes (Critical)
1. Fix JWT secret (remove hardcoded fallback) — **security blocker**
2. Fix role escalation (remove `role` from register params) — **security blocker**
3. Wire routes in `routes.rb`
4. Add `Api::V1::BaseController` with error handling
5. Include `Authenticatable` concern properly
6. Add Rack::Attack rate limiting

### Phase 2: Authorization + Core Endpoints
1. Add Pundit gem + policies
2. Build classrooms controller (teacher scope)
3. Build daily_scores controller (create, update, batch)
4. Build students controller (radar, progress)
5. Build parents/children controller

### Phase 3: Serialization + Testing
1. Add Alba gem + resources
2. Replace inline JSON with Alba resources
3. Fix fixtures (current ones have `MyString` placeholders)
4. Write auth integration tests
5. Write authorization integration tests
6. Write CRUD integration tests

### Phase 4: Performance + COPPA
1. Add Scenic + materialized views for radar data
2. Configure Solid Cache for radar endpoints
3. Add PaperTrail for audit logging
4. Build data export endpoint
5. Build account deletion endpoint
6. Add `encrypts :notes` for score notes

### Phase 5: Polish
1. Solid Cable for real-time score notifications
2. Recurring jobs for materialized view refresh
3. Seed data for development/demo

---

## Sources & Confidence

| Finding | Source | Confidence |
|---------|--------|------------|
| Alba serializer recommendation | Context7 (alba docs) + benchmarks (Jan 2026) + Cookpad | HIGH |
| Pundit authorization | Context7 (Pundit README) | HIGH |
| Rack::Attack patterns | Context7 (rack-attack docs) | HIGH |
| JWT refresh token rotation | Multiple 2025-2026 articles (how2.sh, oneuptime, skycloak.io) | HIGH |
| Rails 8 Solid Queue/Cache/Cable | Context7 (Rails 8.1.2 guides) + production reports | HIGH |
| COPPA requirements | FTC guidelines + multiple 2025-2026 compliance sources | MEDIUM-HIGH |
| Scenic materialized views | Web search (production case study, 9000x speedup) | MEDIUM-HIGH |
| PaperTrail for audit logging | GitHub (6.9k stars, actively maintained) | HIGH |
| Strict loading for N+1 | Rails guides + Thoughtbot (2025) | HIGH |
| Path-based API versioning | Multiple 2025-2026 sources + already scaffolded | HIGH |
