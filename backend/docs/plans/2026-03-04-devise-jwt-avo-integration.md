# Devise-JWT + Avo Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `has_secure_password` + custom `JwtService` with `devise-jwt` for access tokens (keeping custom RefreshToken for refresh flow), and install Avo admin panel.

**Architecture:** Hybrid approach — Devise handles password hashing (`encrypted_password`) and JWT access token generation/validation via `devise-jwt`. Our custom `RefreshToken` model and refresh endpoint stay. Avo mounts at `/avo` with a separate `AdminUser` model for admin authentication. `api_only = true` stays, with Flash middleware added for Avo.

**Tech Stack:** Rails 8.1.2, devise ~> 5.0, devise-jwt ~> 0.12, avo ~> 3.16, PostgreSQL

---

## Phase 1: Database Migration Rewrites

### Task 1: Rewrite teachers migration for Devise columns

**Files:**
- Modify: `db/migrate/20260303165747_create_teachers.rb`

**Step 1: Update migration**

Replace `password_digest` with Devise columns:

```ruby
class CreateTeachers < ActiveRecord::Migration[8.1]
  def change
    create_table :teachers do |t|
      ## Database authenticatable
      t.string :name, null: false
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## Recoverable
      t.string :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## Profile fields
      t.references :school, foreign_key: true
      t.date :birthdate
      t.string :phone
      t.string :address_line1
      t.string :address_line2
      t.string :city
      t.string :state_province
      t.string :postal_code
      t.string :country_code, limit: 2
      t.string :avatar
      t.string :gender
      t.string :religion
      t.string :qualification
      t.text :bio

      t.timestamps
    end

    add_index :teachers, :email, unique: true
    add_index :teachers, :reset_password_token, unique: true
  end
end
```

**Step 2: Verify** — no run yet, just file saved.

---

### Task 2: Rewrite parents migration for Devise columns

**Files:**
- Modify: `db/migrate/20260303165750_create_parents_and_parent_students.rb`

**Step 1: Update migration**

Replace `password_digest` with Devise columns:

```ruby
class CreateParentsAndParentStudents < ActiveRecord::Migration[8.1]
  def change
    create_table :parents do |t|
      ## Database authenticatable
      t.string :name, null: false
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## Recoverable
      t.string :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## Profile fields
      t.string :phone
      t.date :birthdate
      t.string :address_line1
      t.string :address_line2
      t.string :city
      t.string :state_province
      t.string :postal_code
      t.string :country_code, limit: 2
      t.string :avatar
      t.string :gender
      t.string :qualification
      t.text :bio

      t.timestamps
    end

    add_index :parents, :email, unique: true
    add_index :parents, :reset_password_token, unique: true

    create_table :parent_students do |t|
      t.references :parent, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: true

      t.timestamps
    end

    add_index :parent_students, [ :parent_id, :student_id ], unique: true
  end
end
```

---

### Task 3: Add JWT denylist migration

**Files:**
- Create: `db/migrate/20260304020001_create_jwt_denylist.rb`

```ruby
class CreateJwtDenylist < ActiveRecord::Migration[8.1]
  def change
    create_table :jwt_denylist do |t|
      t.string :jti, null: false
      t.datetime :exp, null: false
    end

    add_index :jwt_denylist, :jti
  end
end
```

---

### Task 4: Add admin_users migration

**Files:**
- Create: `db/migrate/20260304020002_create_admin_users.rb`

```ruby
class CreateAdminUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :admin_users do |t|
      ## Database authenticatable
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## Recoverable
      t.string :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      t.timestamps
    end

    add_index :admin_users, :email, unique: true
    add_index :admin_users, :reset_password_token, unique: true
  end
end
```

---

### Task 5: Drop and recreate database

**Step 1: Delete schema.rb**

```bash
rm -f db/schema.rb
```

**Step 2: Drop, create, migrate**

```bash
bin/rails db:drop db:create db:migrate
```

Expected: All 11 migrations run (9 existing + 2 new). No errors.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(db): rewrite migrations for Devise columns + add jwt_denylist and admin_users"
```

---

## Phase 2: Devise + devise-jwt Configuration

### Task 6: Add devise_jwt_secret_key to credentials

**Step 1: Generate a secret**

```bash
cd backend && bin/rails secret
```

**Step 2: Add to credentials**

```bash
EDITOR="code --wait" bin/rails credentials:edit
```

Add:
```yaml
devise_jwt_secret_key: <paste-generated-secret>
```

---

### Task 7: Create Devise initializer

**Files:**
- Create: `config/initializers/devise.rb`

```ruby
# frozen_string_literal: true

Devise.setup do |config|
  config.mailer_sender = "noreply@grewme.app"

  require "devise/orm/active_record"

  config.case_insensitive_keys = [ :email ]
  config.strip_whitespace_keys = [ :email ]
  config.skip_session_storage = [ :http_auth, :params_auth ]
  config.stretches = Rails.env.test? ? 1 : 12
  config.password_length = 8..128
  config.email_regexp = /\A[^@\s]+@[^@\s]+\z/
  config.sign_out_via = :delete
  config.responder.error_status = :unprocessable_entity
  config.responder.redirect_status = :see_other

  config.jwt do |jwt|
    jwt.secret = Rails.application.credentials.devise_jwt_secret_key!
    jwt.expiration_time = 15.minutes.to_i
    jwt.dispatch_requests = [
      [ "POST", %r{^/api/v1/teachers/auth/login$} ],
      [ "POST", %r{^/api/v1/parents/auth/login$} ],
      [ "POST", %r{^/api/v1/teachers/auth/register$} ],
      [ "POST", %r{^/api/v1/parents/auth/register$} ]
    ]
    jwt.revocation_requests = [
      [ "DELETE", %r{^/api/v1/teachers/auth/logout$} ],
      [ "DELETE", %r{^/api/v1/parents/auth/logout$} ]
    ]
  end

  config.navigational_formats = []
end
```

---

### Task 8: Create JwtDenylist model

**Files:**
- Create: `app/models/jwt_denylist.rb`

```ruby
class JwtDenylist < ApplicationRecord
  include Devise::JWT::RevocationStrategies::Denylist

  self.table_name = "jwt_denylist"
end
```

---

### Task 9: Create AdminUser model

**Files:**
- Create: `app/models/admin_user.rb`

```ruby
class AdminUser < ApplicationRecord
  devise :database_authenticatable, :recoverable, :rememberable, :validatable
end
```

---

### Task 10: Update Teacher model for Devise

**Files:**
- Modify: `app/models/teacher.rb`

Replace `has_secure_password` with Devise modules:

```ruby
class Teacher < ApplicationRecord
  devise :database_authenticatable, :registerable, :recoverable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  include Permissionable

  belongs_to :school, optional: true

  has_many :classrooms, foreign_key: :teacher_id, dependent: :destroy, inverse_of: :teacher
  has_many :daily_scores, foreign_key: :teacher_id, dependent: :destroy, inverse_of: :teacher
  has_many :refresh_tokens, as: :authenticatable, dependent: :destroy
  has_many :permissions, as: :permissionable, dependent: :destroy

  validates :name, presence: true

  def role
    "teacher"
  end

  def teacher?
    true
  end

  def parent?
    false
  end

  def admin?
    false
  end

  def jwt_payload
    { "sub" => id, "type" => "Teacher" }
  end
end
```

Note: Devise handles email validation, uniqueness, and password length — remove manual validators.

---

### Task 11: Update Parent model for Devise

**Files:**
- Modify: `app/models/parent.rb`

```ruby
class Parent < ApplicationRecord
  devise :database_authenticatable, :registerable, :recoverable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  include Permissionable

  has_many :parent_students, foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent
  has_many :children, through: :parent_students, source: :student
  has_many :refresh_tokens, as: :authenticatable, dependent: :destroy
  has_many :permissions, as: :permissionable, dependent: :destroy

  validates :name, presence: true

  def role
    "parent"
  end

  def teacher?
    false
  end

  def parent?
    true
  end

  def admin?
    false
  end

  def jwt_payload
    { "sub" => id, "type" => "Parent" }
  end
end
```

---

### Task 12: Update application.rb for Avo middleware

**Files:**
- Modify: `config/application.rb`

```ruby
require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module Grewme
  class Application < Rails::Application
    config.load_defaults 8.1

    config.autoload_lib(ignore: %w[assets tasks])

    # API-only mode (Avo adds its own middleware for admin views)
    config.api_only = true

    config.middleware.use Rack::Attack
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore
    config.middleware.use ActionDispatch::Flash
  end
end
```

---

### Task 13: Update Authenticatable concern for devise-jwt

**Files:**
- Modify: `app/controllers/concerns/authenticatable.rb`

The concern now uses devise-jwt for token decode instead of custom JwtService:

```ruby
module Authenticatable
  extend ActiveSupport::Concern

  private

  def authenticate_user!
    token = extract_token
    if token.blank?
      render json: { error: "Unauthorized" }, status: :unauthorized
      return
    end

    payload = decode_jwt(token)
    if payload.nil?
      render json: { error: "Unauthorized" }, status: :unauthorized
      return
    end

    @current_user = find_authenticatable(payload)

    unless @current_user
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def extract_token
    header = request.headers["Authorization"]
    header&.split(" ")&.last
  end

  def authorize_role!(*roles)
    unless roles.map(&:to_s).include?(current_user.role)
      render json: { error: "Forbidden" }, status: :forbidden
    end
  end

  def decode_jwt(token)
    secret = Rails.application.credentials.devise_jwt_secret_key!
    decoded = JWT.decode(token, secret, true, algorithm: "HS256")
    payload = HashWithIndifferentAccess.new(decoded.first)

    # Check denylist
    return nil if JwtDenylist.exists?(jti: payload[:jti])

    payload
  rescue JWT::DecodeError, JWT::ExpiredSignature => e
    Rails.logger.warn("JWT decode error: #{e.message}")
    nil
  end

  def find_authenticatable(payload)
    type = payload[:type] || payload["type"]
    sub = payload[:sub] || payload["sub"]

    if sub && type
      klass = type.safe_constantize
      return nil unless klass && [ Teacher, Parent ].include?(klass)
      klass.find_by(id: sub)
    end
  end
end
```

---

### Task 14: Update auth controllers for Devise password handling

**Files:**
- Modify: `app/controllers/api/v1/teachers/auth_controller.rb`
- Modify: `app/controllers/api/v1/parents/auth_controller.rb`

Teacher auth controller — login now uses `valid_password?` instead of `authenticate`:

```ruby
module Api
  module V1
    module Teachers
      class AuthController < Api::V1::BaseController
        skip_before_action :authenticate_user!, only: [ :login, :register, :refresh, :logout ]

        def login
          teacher = Teacher.find_by(email: params[:email])

          if teacher&.valid_password?(params[:password])
            access_token = generate_jwt_for(teacher)
            refresh = teacher.refresh_tokens.create!(
              ip_address: request.remote_ip,
              user_agent: request.user_agent
            )
            render json: {
              access_token: access_token,
              refresh_token: refresh.raw_token,
              expires_in: Devise::JWT.config.expiration_time,
              user: user_json(teacher)
            }
          else
            render json: { error: { code: "invalid_credentials", message: "Invalid email or password" } }, status: :unauthorized
          end
        end

        def register
          teacher = Teacher.new(register_params)

          if teacher.save
            access_token = generate_jwt_for(teacher)
            refresh = teacher.refresh_tokens.create!(
              ip_address: request.remote_ip,
              user_agent: request.user_agent
            )
            render json: {
              access_token: access_token,
              refresh_token: refresh.raw_token,
              expires_in: Devise::JWT.config.expiration_time,
              user: user_json(teacher)
            }, status: :created
          else
            render json: { error: { code: "validation_failed", message: "Validation failed", details: teacher.errors.full_messages } }, status: :unprocessable_entity
          end
        end

        def refresh
          raw_token = params[:refresh_token]
          if raw_token.blank?
            return render json: { error: { code: "missing_token", message: "Refresh token is required" } }, status: :bad_request
          end

          token_digest = Digest::SHA256.hexdigest(raw_token)
          refresh_token = RefreshToken.find_by(token_digest: token_digest, authenticatable_type: "Teacher")

          if refresh_token.nil? || !refresh_token.active?
            return render json: { error: { code: "invalid_token", message: "Invalid or expired refresh token" } }, status: :unauthorized
          end

          refresh_token.revoke!

          teacher = refresh_token.authenticatable
          new_access_token = generate_jwt_for(teacher)
          new_refresh = teacher.refresh_tokens.create!(
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )

          render json: {
            access_token: new_access_token,
            refresh_token: new_refresh.raw_token,
            expires_in: Devise::JWT.config.expiration_time
          }
        end

        def logout
          authenticate_user!
          return if performed?

          # Revoke the current JWT by adding jti to denylist
          token = extract_token
          payload = decode_jwt(token)
          if payload
            JwtDenylist.create!(jti: payload[:jti], exp: Time.at(payload[:exp]))
          end

          # Revoke all active refresh tokens
          current_user.refresh_tokens.active.find_each(&:revoke!)

          render json: { message: "Logged out successfully" }
        end

        private

        def register_params
          params.permit(:name, :email, :password, :password_confirmation)
        end

        def user_json(teacher)
          { id: teacher.id, name: teacher.name, email: teacher.email, role: teacher.role }
        end

        def generate_jwt_for(entity)
          secret = Rails.application.credentials.devise_jwt_secret_key!
          payload = entity.jwt_payload.merge(
            jti: SecureRandom.uuid,
            iat: Time.current.to_i,
            exp: Devise::JWT.config.expiration_time.seconds.from_now.to_i
          )
          JWT.encode(payload, secret, "HS256")
        end
      end
    end
  end
end
```

Parent auth controller — same pattern:

```ruby
module Api
  module V1
    module Parents
      class AuthController < Api::V1::BaseController
        skip_before_action :authenticate_user!, only: [ :login, :register, :refresh, :logout ]

        def login
          parent = Parent.find_by(email: params[:email])

          if parent&.valid_password?(params[:password])
            access_token = generate_jwt_for(parent)
            refresh = parent.refresh_tokens.create!(
              ip_address: request.remote_ip,
              user_agent: request.user_agent
            )
            render json: {
              access_token: access_token,
              refresh_token: refresh.raw_token,
              expires_in: Devise::JWT.config.expiration_time,
              user: user_json(parent)
            }
          else
            render json: { error: { code: "invalid_credentials", message: "Invalid email or password" } }, status: :unauthorized
          end
        end

        def register
          parent = Parent.new(register_params)

          if parent.save
            access_token = generate_jwt_for(parent)
            refresh = parent.refresh_tokens.create!(
              ip_address: request.remote_ip,
              user_agent: request.user_agent
            )
            render json: {
              access_token: access_token,
              refresh_token: refresh.raw_token,
              expires_in: Devise::JWT.config.expiration_time,
              user: user_json(parent)
            }, status: :created
          else
            render json: { error: { code: "validation_failed", message: "Validation failed", details: parent.errors.full_messages } }, status: :unprocessable_entity
          end
        end

        def refresh
          raw_token = params[:refresh_token]
          if raw_token.blank?
            return render json: { error: { code: "missing_token", message: "Refresh token is required" } }, status: :bad_request
          end

          token_digest = Digest::SHA256.hexdigest(raw_token)
          refresh_token = RefreshToken.find_by(token_digest: token_digest, authenticatable_type: "Parent")

          if refresh_token.nil? || !refresh_token.active?
            return render json: { error: { code: "invalid_token", message: "Invalid or expired refresh token" } }, status: :unauthorized
          end

          refresh_token.revoke!

          parent = refresh_token.authenticatable
          new_access_token = generate_jwt_for(parent)
          new_refresh = parent.refresh_tokens.create!(
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )

          render json: {
            access_token: new_access_token,
            refresh_token: new_refresh.raw_token,
            expires_in: Devise::JWT.config.expiration_time
          }
        end

        def logout
          authenticate_user!
          return if performed?

          token = extract_token
          payload = decode_jwt(token)
          if payload
            JwtDenylist.create!(jti: payload[:jti], exp: Time.at(payload[:exp]))
          end

          current_user.refresh_tokens.active.find_each(&:revoke!)

          render json: { message: "Logged out successfully" }
        end

        private

        def register_params
          params.permit(:name, :email, :password, :password_confirmation, :phone)
        end

        def user_json(parent)
          { id: parent.id, name: parent.name, email: parent.email, role: parent.role }
        end

        def generate_jwt_for(entity)
          secret = Rails.application.credentials.devise_jwt_secret_key!
          payload = entity.jwt_payload.merge(
            jti: SecureRandom.uuid,
            iat: Time.current.to_i,
            exp: Devise::JWT.config.expiration_time.seconds.from_now.to_i
          )
          JWT.encode(payload, secret, "HS256")
        end
      end
    end
  end
end
```

---

### Task 15: Update routes for logout + Avo

**Files:**
- Modify: `config/routes.rb`

```ruby
Rails.application.routes.draw do
  # Avo admin panel
  mount Avo::Engine, at: Avo.configuration.root_path

  namespace :api do
    namespace :v1 do
      # Teacher auth
      namespace :teachers do
        post "auth/login", to: "auth#login"
        post "auth/register", to: "auth#register"
        post "auth/refresh", to: "auth#refresh"
        delete "auth/logout", to: "auth#logout"
      end

      # Parent auth
      namespace :parents do
        post "auth/login", to: "auth#login"
        post "auth/register", to: "auth#register"
        post "auth/refresh", to: "auth#refresh"
        delete "auth/logout", to: "auth#logout"
        resources :children, only: [ :index ]
      end

      # Classrooms (teacher)
      resources :classrooms, only: [ :index, :show ] do
        get :overview, on: :member
        resources :students, only: [ :index ], controller: "classrooms/students"
      end

      # Scores
      resources :daily_scores, only: [ :create, :update ]

      # Students (shared by teacher + parent)
      resources :students, only: [ :show ] do
        get :radar, on: :member
        get :progress, on: :member
        resources :daily_scores, only: [ :index ], controller: "students/daily_scores"
      end

      # Admin endpoints
      namespace :admin do
        resources :teachers, only: [] do
          resources :permissions, only: [ :index, :create, :update, :destroy ]
        end
        resources :parents, only: [] do
          resources :permissions, only: [ :index, :create, :update, :destroy ]
        end
      end
    end
  end

  get "up" => "rails/health#show", :as => :rails_health_check
end
```

---

### Task 16: Remove JwtService (replaced by devise-jwt)

**Files:**
- Delete: `app/services/jwt_service.rb`
- Delete: `test/services/jwt_service_test.rb`

The `generate_jwt_for` helper in auth controllers + `decode_jwt` in Authenticatable concern replaces all JwtService functionality.

---

### Task 17: Commit Phase 2

```bash
git add -A && git commit -m "feat(auth): integrate devise-jwt with hybrid refresh token approach"
```

---

## Phase 3: Avo Admin Panel

### Task 18: Install Avo

```bash
bin/rails generate avo:install
```

This creates `config/initializers/avo.rb` and mounts Avo in routes (we already have the mount).

---

### Task 19: Configure Avo initializer

**Files:**
- Modify: `config/initializers/avo.rb`

```ruby
Avo.configure do |config|
  config.root_path = "/avo"
  config.app_name = "GrewMe Admin"
  config.current_user_method = :current_admin_user
  config.set_initial_breadcrumbs do
    add_breadcrumb "Home", "/avo"
  end
end
```

---

### Task 20: Create Avo authentication controller

**Files:**
- Create: `app/controllers/avo/base_controller.rb` (if needed by Avo)

Actually, Avo handles its own auth. We need to configure `current_admin_user` method. Add to ApplicationController:

**Files:**
- Modify: `app/controllers/application_controller.rb`

```ruby
class ApplicationController < ActionController::API
  include Authenticatable

  before_action :authenticate_user!

  private

  def current_admin_user
    # For Avo — session-based auth for admin panel
    return unless session[:admin_user_id]
    @current_admin_user ||= AdminUser.find_by(id: session[:admin_user_id])
  end
  helper_method :current_admin_user if respond_to?(:helper_method)
end
```

Note: Avo will need its own session-based login. We'll create a simple login page.

---

### Task 21: Create Avo resources

**Files:**
- Create: `app/avo/resources/teacher.rb`
- Create: `app/avo/resources/parent.rb`
- Create: `app/avo/resources/student.rb`
- Create: `app/avo/resources/classroom.rb`
- Create: `app/avo/resources/school.rb`
- Create: `app/avo/resources/daily_score.rb`
- Create: `app/avo/resources/classroom_student.rb`
- Create: `app/avo/resources/permission.rb`

Example — `app/avo/resources/teacher.rb`:

```ruby
class Avo::Resources::Teacher < Avo::BaseResource
  self.title = :name
  self.includes = [ :school, :classrooms ]

  def fields
    field :id, as: :id
    field :name, as: :text
    field :email, as: :text
    field :school, as: :belongs_to
    field :phone, as: :text
    field :gender, as: :text
    field :qualification, as: :text
    field :bio, as: :textarea
    field :classrooms, as: :has_many
    field :daily_scores, as: :has_many
    field :created_at, as: :date_time, sortable: true
  end
end
```

(Similar for other resources — each with appropriate fields and associations.)

---

### Task 22: Commit Phase 3

```bash
git add -A && git commit -m "feat(admin): install and configure Avo admin panel with resources"
```

---

## Phase 4: Update Fixtures, Seeds, and Tests

### Task 23: Update fixtures for encrypted_password

**Files:**
- Modify: `test/fixtures/teachers.yml`
- Modify: `test/fixtures/parents.yml`

teachers.yml:
```yaml
teacher_alice:
  name: Alice Teacher
  email: alice@school.test
  encrypted_password: <%= Devise::Encryptor.digest(Teacher, "password123") %>

teacher_bob:
  name: Bob Teacher
  email: bob@school.test
  encrypted_password: <%= Devise::Encryptor.digest(Teacher, "password123") %>
```

parents.yml:
```yaml
parent_carol:
  name: Carol Parent
  email: carol@parent.test
  encrypted_password: <%= Devise::Encryptor.digest(Parent, "password123") %>
```

---

### Task 24: Update test_helper for devise-jwt

**Files:**
- Modify: `test/test_helper.rb`

```ruby
require "simplecov"
SimpleCov.start "rails" do
  enable_coverage :branch
  minimum_coverage 50
  add_filter "/test/"
  add_filter "/config/"
  add_filter "/db/"
end

ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module AuthTestHelper
  def auth_headers(user)
    secret = Rails.application.credentials.devise_jwt_secret_key!
    payload = user.jwt_payload.merge(
      jti: SecureRandom.uuid,
      iat: Time.current.to_i,
      exp: 15.minutes.from_now.to_i
    )
    token = JWT.encode(payload, secret, "HS256")
    { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" }
  end

  def auth_get(path, user:, params: {})
    get path, params: params, headers: auth_headers(user)
  end

  def auth_post(path, user:, params: {})
    post path, params: params.to_json, headers: auth_headers(user)
  end

  def auth_put(path, user:, params: {})
    put path, params: params.to_json, headers: auth_headers(user)
  end

  def auth_delete(path, user:)
    delete path, headers: auth_headers(user)
  end
end

module ActiveSupport
  class TestCase
    fixtures :all
    parallelize(workers: 1)
  end
end

class ActionDispatch::IntegrationTest
  include AuthTestHelper
end
```

---

### Task 25: Update model tests

**Files:**
- Modify: `test/models/teacher_test.rb`
- Modify: `test/models/parent_test.rb`

Teacher test — replace `has_secure_password` test with `valid_password?`:

```ruby
require "test_helper"

class TeacherTest < ActiveSupport::TestCase
  test "validates name presence" do
    teacher = Teacher.new(name: nil, email: "test@test.com", password: "password123")
    assert_not teacher.valid?
    assert_includes teacher.errors[:name], "can't be blank"
  end

  test "validates email presence" do
    teacher = Teacher.new(name: "Test", email: nil, password: "password123")
    assert_not teacher.valid?
    assert_includes teacher.errors[:email], "can't be blank"
  end

  test "validates email uniqueness" do
    teacher = Teacher.new(name: "Test", email: teachers(:teacher_alice).email, password: "password123")
    assert_not teacher.valid?
    assert_includes teacher.errors[:email], "has already been taken"
  end

  test "validates email format" do
    teacher = Teacher.new(name: "Test", email: "not-an-email", password: "password123")
    assert_not teacher.valid?
    assert_includes teacher.errors[:email], "is invalid"
  end

  test "validates password minimum length" do
    teacher = Teacher.new(name: "Test", email: "new@test.com", password: "short")
    assert_not teacher.valid?
    assert teacher.errors[:password].any? { |e| e.include?("too short") }
  end

  test "accepts valid password of 8 characters" do
    teacher = Teacher.new(name: "Test", email: "new@test.com", password: "12345678", password_confirmation: "12345678")
    assert teacher.valid?
  end

  test "devise authenticates with valid_password?" do
    teacher = teachers(:teacher_alice)
    assert teacher.valid_password?("password123")
    assert_not teacher.valid_password?("wrongpassword")
  end

  test "role returns teacher" do
    assert_equal "teacher", teachers(:teacher_alice).role
  end

  test "teacher? returns true" do
    assert teachers(:teacher_alice).teacher?
  end

  test "parent? returns false" do
    assert_not teachers(:teacher_alice).parent?
  end

  test "teacher has classrooms" do
    teacher = teachers(:teacher_alice)
    assert_includes teacher.classrooms, classrooms(:alice_class)
  end

  test "jwt_payload includes sub and type" do
    teacher = teachers(:teacher_alice)
    payload = teacher.jwt_payload
    assert_equal teacher.id, payload["sub"]
    assert_equal "Teacher", payload["type"]
  end
end
```

Parent test — same pattern with `valid_password?` and `jwt_payload`.

---

### Task 26: Update auth controller tests

**Files:**
- Modify: `test/controllers/api/v1/teachers/auth_controller_test.rb`
- Modify: `test/controllers/api/v1/parents/auth_controller_test.rb`

Add logout tests, keep existing tests (they should still work since our endpoints haven't changed shape).

Add to teacher auth test:
```ruby
test "logout revokes JWT and refresh tokens" do
  # Login first
  post api_v1_teachers_auth_login_path, params: { email: "alice@school.test", password: "password123" }.to_json,
    headers: { "Content-Type" => "application/json" }
  body = JSON.parse(response.body)
  token = body["access_token"]

  # Logout
  delete api_v1_teachers_auth_logout_path, headers: { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" }
  assert_response :ok

  # Token should now be denied
  get api_v1_classrooms_path, headers: { "Authorization" => "Bearer #{token}" }
  assert_response :unauthorized
end
```

---

### Task 27: Update seeds for Devise password

**Files:**
- Modify: `db/seeds.rb`

No change needed — `Teacher.create!(password: "password123")` works with Devise too. Devise uses `password=` setter which hashes to `encrypted_password`.

---

### Task 28: Run tests

```bash
bin/rails db:test:prepare && bin/rails test
```

Expected: All tests pass.

---

### Task 29: Run RuboCop

```bash
bundle exec rubocop
```

Expected: 0 offenses.

---

### Task 30: Commit Phase 4

```bash
git add -A && git commit -m "test(auth): update all fixtures and tests for devise-jwt"
```

---

## Phase 5: Cleanup and Verification

### Task 31: Run full test suite + seed

```bash
bin/rails db:drop db:create db:migrate db:seed
bin/rails db:test:prepare && bin/rails test
bundle exec rubocop
```

All must pass.

---

### Task 32: Final commit

```bash
git add -A && git commit -m "chore: devise-jwt + avo integration complete"
```

---

### Task 33: Save to Outline

Create document in GrewMe collection summarizing the devise-jwt + Avo integration.
