# Dynamic Permissions System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `permissions` table so admins can grant/revoke per-user, per-action permissions that layer on top of role-based defaults.

**Architecture:** A `Permission` model stores per-user overrides (grant or revoke). A `Permissionable` concern provides `has_permission?` that checks overrides first, then falls back to role defaults defined in `RolePermissions::DEFAULTS`. Existing Pundit policies switch from hardcoded role checks to `has_permission?` + ownership. An admin-only API manages permission CRUD.

**Tech Stack:** Rails 8.1.2, Pundit, Alba, Minitest

---

### Task 1: Create Permission Model + Migration

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_create_permissions.rb`
- Create: `backend/app/models/permission.rb`
- Modify: `backend/app/models/user.rb`
- Create: `backend/test/fixtures/permissions.yml`

**Step 1: Generate migration**

Run:
```bash
cd backend && bin/rails generate migration CreatePermissions user:references resource:string action:string granted:boolean
```

**Step 2: Edit migration for constraints**

Edit the generated migration to match:

```ruby
class CreatePermissions < ActiveRecord::Migration[8.1]
  def change
    create_table :permissions do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.string :resource, null: false
      t.string :action, null: false
      t.boolean :granted, null: false, default: true

      t.timestamps
    end

    add_index :permissions, [:user_id, :resource, :action], unique: true, name: "index_permissions_uniqueness"
  end
end
```

**Step 3: Create Permission model**

```ruby
# backend/app/models/permission.rb
class Permission < ApplicationRecord
  belongs_to :user

  VALID_RESOURCES = %w[classrooms students daily_scores children].freeze
  VALID_ACTIONS = %w[index show create update destroy overview radar progress].freeze

  validates :resource, presence: true, inclusion: { in: VALID_RESOURCES }
  validates :action, presence: true, inclusion: { in: VALID_ACTIONS }
  validates :action, uniqueness: { scope: [:user_id, :resource], message: "already exists for this user and resource" }

  scope :for_resource, ->(resource) { where(resource: resource) }
  scope :grants, -> { where(granted: true) }
  scope :revocations, -> { where(granted: false) }
end
```

**Step 4: Add association to User**

In `backend/app/models/user.rb`, add after `has_many :refresh_tokens`:

```ruby
has_many :permissions, dependent: :destroy
```

**Step 5: Create empty fixtures file**

```yaml
# backend/test/fixtures/permissions.yml
# Permissions are created dynamically in tests
```

**Step 6: Run migration**

Run:
```bash
cd backend && bin/rails db:migrate
```

**Step 7: Commit**

```bash
git add -A && git commit -m "feat(permissions): add Permission model and migration"
```

---

### Task 2: Create RolePermissions Config + Permissionable Concern

**Files:**
- Create: `backend/config/initializers/role_permissions.rb`
- Create: `backend/app/models/concerns/permissionable.rb`

**Step 1: Create role defaults config**

```ruby
# backend/config/initializers/role_permissions.rb
module RolePermissions
  DEFAULTS = {
    "teacher" => {
      "classrooms"   => %w[index show overview],
      "students"     => %w[show radar progress],
      "daily_scores" => %w[index create update]
    },
    "parent" => {
      "students"     => %w[show radar progress],
      "daily_scores" => %w[index],
      "children"     => %w[index]
    },
    "admin" => :all
  }.freeze
end
```

**Step 2: Create Permissionable concern**

```ruby
# backend/app/models/concerns/permissionable.rb
module Permissionable
  extend ActiveSupport::Concern

  # Check if user has permission for a given action on a resource.
  # 1. Check for per-user override in permissions table
  # 2. Fall back to role defaults
  def has_permission?(resource, action)
    resource = resource.to_s
    action = action.to_s

    override = permissions.find_by(resource: resource, action: action)
    return override.granted? if override

    role_allows?(resource, action)
  end

  # Check role defaults
  def role_allows?(resource, action)
    defaults = RolePermissions::DEFAULTS[role]
    return true if defaults == :all
    return false if defaults.nil?

    defaults.fetch(resource.to_s, []).include?(action.to_s)
  end

  # Return all effective permissions as a hash
  # { "classrooms" => { "index" => true, "show" => true, "create" => false }, ... }
  def effective_permissions
    result = {}

    # Start with role defaults
    defaults = RolePermissions::DEFAULTS[role]
    if defaults == :all
      Permission::VALID_RESOURCES.each do |res|
        result[res] = Permission::VALID_ACTIONS.each_with_object({}) { |act, h| h[act] = true }
      end
    elsif defaults
      defaults.each do |res, actions|
        result[res] = actions.each_with_object({}) { |act, h| h[act] = true }
      end
    end

    # Apply overrides
    permissions.find_each do |perm|
      result[perm.resource] ||= {}
      result[perm.resource][perm.action] = perm.granted?
    end

    result
  end
end
```

**Step 3: Include concern in User model**

In `backend/app/models/user.rb`, add after `has_secure_password`:

```ruby
include Permissionable
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(permissions): add RolePermissions config and Permissionable concern"
```

---

### Task 3: Update Pundit Policies

**Files:**
- Modify: `backend/app/policies/application_policy.rb`
- Modify: `backend/app/policies/classroom_policy.rb`
- Modify: `backend/app/policies/student_policy.rb`
- Modify: `backend/app/policies/daily_score_policy.rb`

**Step 1: Add permission helper to ApplicationPolicy**

Replace `backend/app/policies/application_policy.rb` with:

```ruby
class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index?
    false
  end

  def show?
    false
  end

  def create?
    false
  end

  def update?
    false
  end

  def destroy?
    false
  end

  private

  # Check dynamic permission for the current resource and action
  def permitted?(action)
    user.has_permission?(resource_name, action)
  end

  # Derive resource name from the record class
  # For a Classroom record → "classrooms"
  # For a Class (scope) → use the class itself
  def resource_name
    klass = record.is_a?(Class) ? record : record.class
    klass.model_name.plural
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      raise NotImplementedError
    end
  end
end
```

**Step 2: Update ClassroomPolicy**

Replace `backend/app/policies/classroom_policy.rb` with:

```ruby
class ClassroomPolicy < ApplicationPolicy
  def index?
    permitted?(:index)
  end

  def show?
    permitted?(:show) && (user.admin? || owns_classroom?)
  end

  def overview?
    permitted?(:overview) && (user.admin? || owns_classroom?)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.has_permission?("classrooms", "index")
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
```

**Step 3: Update StudentPolicy**

Replace `backend/app/policies/student_policy.rb` with:

```ruby
class StudentPolicy < ApplicationPolicy
  def show?
    permitted?(:show) && (user.admin? || teaches_student? || parents_student?)
  end

  def radar?
    permitted?(:radar) && (user.admin? || teaches_student? || parents_student?)
  end

  def progress?
    permitted?(:progress) && (user.admin? || teaches_student? || parents_student?)
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
    user.parent? && user.children.exists?(record.id)
  end
end
```

**Step 4: Update DailyScorePolicy**

Replace `backend/app/policies/daily_score_policy.rb` with:

```ruby
class DailyScorePolicy < ApplicationPolicy
  def create?
    permitted?(:create)
  end

  def update?
    permitted?(:update) && (user.admin? || owns_score?)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.teacher?
        scope.where(teacher_id: user.id)
      elsif user.parent?
        scope.joins(student: :parent_students).where(parent_students: { parent_id: user.id })
      else
        scope.none
      end
    end
  end

  private

  def owns_score?
    user.teacher? && record.teacher_id == user.id
  end
end
```

**Step 5: Run existing tests to verify nothing broke**

Run:
```bash
cd backend && bin/rails test
```

Expected: All 79 tests pass (role defaults match previous hardcoded behavior).

**Step 6: Commit**

```bash
git add -A && git commit -m "refactor(permissions): update Pundit policies to use dynamic permissions"
```

---

### Task 4: Admin Permissions Controller + Routes

**Files:**
- Create: `backend/app/controllers/api/v1/admin/permissions_controller.rb`
- Create: `backend/app/policies/permission_policy.rb`
- Create: `backend/app/resources/permission_resource.rb`
- Modify: `backend/config/routes.rb`

**Step 1: Create PermissionPolicy (admin-only)**

```ruby
# backend/app/policies/permission_policy.rb
class PermissionPolicy < ApplicationPolicy
  def index?
    user.admin?
  end

  def create?
    user.admin?
  end

  def update?
    user.admin?
  end

  def destroy?
    user.admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      else
        scope.none
      end
    end
  end
end
```

**Step 2: Create PermissionResource (Alba)**

```ruby
# backend/app/resources/permission_resource.rb
class PermissionResource
  include Alba::Resource

  root_key :permission
  attributes :id, :user_id, :resource, :action, :granted
end
```

**Step 3: Create Admin::PermissionsController**

```ruby
# backend/app/controllers/api/v1/admin/permissions_controller.rb
module Api
  module V1
    module Admin
      class PermissionsController < BaseController
        before_action :set_target_user
        before_action :set_permission, only: [:update, :destroy]

        # GET /api/v1/admin/users/:user_id/permissions
        def index
          authorize Permission
          permissions = @target_user.permissions
          effective = @target_user.effective_permissions

          render json: {
            user_id: @target_user.id,
            role: @target_user.role,
            overrides: PermissionResource.new(permissions).serialize,
            effective: effective
          }
        end

        # POST /api/v1/admin/users/:user_id/permissions
        def create
          permission = @target_user.permissions.build(permission_params)
          authorize permission

          if permission.save
            render json: PermissionResource.new(permission).serialize, status: :created
          else
            render json: { error: { code: "validation_failed", message: "Validation failed", details: permission.errors } }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/admin/users/:user_id/permissions/:id
        def update
          authorize @permission

          if @permission.update(update_params)
            render json: PermissionResource.new(@permission).serialize
          else
            render json: { error: { code: "validation_failed", message: "Validation failed", details: @permission.errors } }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/admin/users/:user_id/permissions/:id
        def destroy
          authorize @permission
          @permission.destroy!
          head :no_content
        end

        private

        def set_target_user
          @target_user = User.find(params[:user_id])
        end

        def set_permission
          @permission = @target_user.permissions.find(params[:id])
        end

        def permission_params
          params.require(:permission).permit(:resource, :action, :granted)
        end

        def update_params
          params.require(:permission).permit(:granted)
        end
      end
    end
  end
end
```

**Step 4: Add admin routes**

In `backend/config/routes.rb`, add inside the `namespace :v1` block, after the parents namespace:

```ruby
# Admin endpoints
namespace :admin do
  resources :users, only: [] do
    resources :permissions, only: [:index, :create, :update, :destroy]
  end
end
```

**Step 5: Verify routes**

Run:
```bash
cd backend && bin/rails routes | grep permission
```

Expected output should show 4 routes:
```
api_v1_admin_user_permissions GET    /api/v1/admin/users/:user_id/permissions(.:format)     api/v1/admin/permissions#index
                              POST   /api/v1/admin/users/:user_id/permissions(.:format)     api/v1/admin/permissions#create
 api_v1_admin_user_permission PATCH  /api/v1/admin/users/:user_id/permissions/:id(.:format) api/v1/admin/permissions#update
                              DELETE /api/v1/admin/users/:user_id/permissions/:id(.:format) api/v1/admin/permissions#destroy
```

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(permissions): add admin permissions controller, policy, resource, and routes"
```

---

### Task 5: Permission Model Tests

**Files:**
- Create: `backend/test/models/permission_test.rb`

**Step 1: Write model tests**

```ruby
# backend/test/models/permission_test.rb
require "test_helper"

class PermissionTest < ActiveSupport::TestCase
  setup do
    @user = users(:teacher_alice)
  end

  test "valid permission" do
    perm = Permission.new(user: @user, resource: "classrooms", action: "destroy", granted: true)
    assert perm.valid?
  end

  test "requires user" do
    perm = Permission.new(resource: "classrooms", action: "index")
    assert_not perm.valid?
    assert_includes perm.errors[:user], "must exist"
  end

  test "requires resource" do
    perm = Permission.new(user: @user, resource: nil, action: "index")
    assert_not perm.valid?
    assert_includes perm.errors[:resource], "can't be blank"
  end

  test "requires action" do
    perm = Permission.new(user: @user, resource: "classrooms", action: nil)
    assert_not perm.valid?
    assert_includes perm.errors[:action], "can't be blank"
  end

  test "validates resource inclusion" do
    perm = Permission.new(user: @user, resource: "invalid", action: "index")
    assert_not perm.valid?
    assert_includes perm.errors[:resource], "is not included in the list"
  end

  test "validates action inclusion" do
    perm = Permission.new(user: @user, resource: "classrooms", action: "invalid")
    assert_not perm.valid?
    assert_includes perm.errors[:action], "is not included in the list"
  end

  test "enforces uniqueness of user + resource + action" do
    Permission.create!(user: @user, resource: "classrooms", action: "destroy", granted: true)
    dup = Permission.new(user: @user, resource: "classrooms", action: "destroy", granted: false)
    assert_not dup.valid?
    assert_includes dup.errors[:action], "already exists for this user and resource"
  end

  test "grants scope" do
    Permission.create!(user: @user, resource: "classrooms", action: "destroy", granted: true)
    Permission.create!(user: @user, resource: "students", action: "create", granted: false)
    assert_equal 1, Permission.grants.count
    assert_equal 1, Permission.revocations.count
  end

  test "for_resource scope" do
    Permission.create!(user: @user, resource: "classrooms", action: "destroy", granted: true)
    Permission.create!(user: @user, resource: "students", action: "create", granted: true)
    assert_equal 1, Permission.for_resource("classrooms").count
  end

  test "default granted is true" do
    perm = Permission.create!(user: @user, resource: "classrooms", action: "destroy")
    assert perm.granted?
  end
end
```

**Step 2: Run tests**

Run:
```bash
cd backend && bin/rails test test/models/permission_test.rb -v
```

Expected: All 10 tests pass.

**Step 3: Commit**

```bash
git add -A && git commit -m "test(permissions): add Permission model tests"
```

---

### Task 6: Permissionable Concern Tests

**Files:**
- Create: `backend/test/models/concerns/permissionable_test.rb`

**Step 1: Write concern tests**

```ruby
# backend/test/models/concerns/permissionable_test.rb
require "test_helper"

class PermissionableTest < ActiveSupport::TestCase
  test "teacher has default classroom index permission" do
    teacher = users(:teacher_alice)
    assert teacher.has_permission?("classrooms", "index")
  end

  test "teacher does not have default classroom destroy permission" do
    teacher = users(:teacher_alice)
    assert_not teacher.has_permission?("classrooms", "destroy")
  end

  test "parent has default children index permission" do
    parent = users(:parent_carol)
    assert parent.has_permission?("children", "index")
  end

  test "parent does not have default daily_scores create permission" do
    parent = users(:parent_carol)
    assert_not parent.has_permission?("daily_scores", "create")
  end

  test "admin has permission for everything" do
    admin = users(:admin_dave)
    assert admin.has_permission?("classrooms", "destroy")
    assert admin.has_permission?("students", "create")
    assert admin.has_permission?("daily_scores", "update")
  end

  test "override grants extra permission" do
    parent = users(:parent_carol)
    assert_not parent.has_permission?("daily_scores", "create")

    Permission.create!(user: parent, resource: "daily_scores", action: "create", granted: true)
    assert parent.has_permission?("daily_scores", "create")
  end

  test "override revokes default permission" do
    teacher = users(:teacher_alice)
    assert teacher.has_permission?("classrooms", "index")

    Permission.create!(user: teacher, resource: "classrooms", action: "index", granted: false)
    assert_not teacher.has_permission?("classrooms", "index")
  end

  test "role_allows checks role defaults only" do
    teacher = users(:teacher_alice)
    assert teacher.role_allows?("classrooms", "index")
    assert_not teacher.role_allows?("classrooms", "destroy")
  end

  test "effective_permissions includes defaults and overrides" do
    teacher = users(:teacher_alice)
    Permission.create!(user: teacher, resource: "classrooms", action: "destroy", granted: true)
    Permission.create!(user: teacher, resource: "classrooms", action: "index", granted: false)

    effective = teacher.effective_permissions
    assert_equal true, effective["classrooms"]["destroy"]
    assert_equal false, effective["classrooms"]["index"]
    assert_equal true, effective["classrooms"]["show"]
  end
end
```

**Step 2: Run tests**

Run:
```bash
cd backend && bin/rails test test/models/concerns/permissionable_test.rb -v
```

Expected: All 9 tests pass.

**Step 3: Commit**

```bash
git add -A && git commit -m "test(permissions): add Permissionable concern tests"
```

---

### Task 7: Admin Permissions Controller Tests

**Files:**
- Create: `backend/test/controllers/api/v1/admin/permissions_controller_test.rb`

**Step 1: Write controller tests**

```ruby
# backend/test/controllers/api/v1/admin/permissions_controller_test.rb
require "test_helper"

class Api::V1::Admin::PermissionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:admin_dave)
    @teacher = users(:teacher_alice)
  end

  # INDEX
  test "admin lists user permissions" do
    auth_get api_v1_admin_user_permissions_path(@teacher), user: @admin
    assert_response :ok
    body = JSON.parse(response.body)
    assert_equal @teacher.id, body["user_id"]
    assert_equal "teacher", body["role"]
    assert body.key?("effective")
  end

  test "non-admin cannot list permissions" do
    auth_get api_v1_admin_user_permissions_path(@teacher), user: @teacher
    assert_response :forbidden
  end

  # CREATE
  test "admin grants extra permission" do
    assert_difference "Permission.count", 1 do
      auth_post api_v1_admin_user_permissions_path(@teacher), user: @admin, params: {
        permission: { resource: "classrooms", action: "destroy", granted: true }
      }
    end
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "classrooms", body["permission"]["resource"]
    assert_equal "destroy", body["permission"]["action"]
    assert_equal true, body["permission"]["granted"]
  end

  test "admin revokes default permission" do
    assert_difference "Permission.count", 1 do
      auth_post api_v1_admin_user_permissions_path(@teacher), user: @admin, params: {
        permission: { resource: "classrooms", action: "index", granted: false }
      }
    end
    assert_response :created
    assert_not @teacher.has_permission?("classrooms", "index")
  end

  test "admin cannot create duplicate permission" do
    Permission.create!(user: @teacher, resource: "classrooms", action: "destroy", granted: true)
    auth_post api_v1_admin_user_permissions_path(@teacher), user: @admin, params: {
      permission: { resource: "classrooms", action: "destroy", granted: false }
    }
    assert_response :unprocessable_entity
  end

  test "non-admin cannot create permission" do
    auth_post api_v1_admin_user_permissions_path(@teacher), user: @teacher, params: {
      permission: { resource: "classrooms", action: "destroy", granted: true }
    }
    assert_response :forbidden
  end

  # UPDATE
  test "admin toggles permission" do
    perm = Permission.create!(user: @teacher, resource: "classrooms", action: "destroy", granted: true)
    auth_put api_v1_admin_user_permission_path(@teacher, perm), user: @admin, params: {
      permission: { granted: false }
    }
    assert_response :ok
    perm.reload
    assert_not perm.granted?
  end

  # DESTROY
  test "admin removes override" do
    perm = Permission.create!(user: @teacher, resource: "classrooms", action: "destroy", granted: true)
    assert_difference "Permission.count", -1 do
      auth_delete api_v1_admin_user_permission_path(@teacher, perm), user: @admin
    end
    assert_response :no_content
  end

  test "non-admin cannot delete permission" do
    perm = Permission.create!(user: @teacher, resource: "classrooms", action: "destroy", granted: true)
    auth_delete api_v1_admin_user_permission_path(@teacher, perm), user: @teacher
    assert_response :forbidden
  end
end
```

**Step 2: Run tests**

Run:
```bash
cd backend && bin/rails test test/controllers/api/v1/admin/permissions_controller_test.rb -v
```

Expected: All 9 tests pass.

**Step 3: Run full test suite**

Run:
```bash
cd backend && bin/rails test
```

Expected: All tests pass (previous 79 + new ~28 = ~107 total).

**Step 4: Run RuboCop**

Run:
```bash
cd backend && bundle exec rubocop
```

Expected: No offenses.

**Step 5: Commit**

```bash
git add -A && git commit -m "test(permissions): add admin permissions controller tests"
```

---

### Task 8: Save to Outline

**Step 1: Create Outline document**

Save a summary of the dynamic permissions feature to the GrewMe Outline collection (`d74aedb6-0aa1-4f5f-a8b4-b265e7517649`).

Title: `Feat: Dynamic Permissions System`

Content should summarize: what was built, the permission resolution flow, admin API endpoints, and test coverage.

**Step 2: Commit any remaining changes**

```bash
git status && git add -A && git commit -m "feat(permissions): complete dynamic permissions system"
```
