# Head of School / School Manager Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a SchoolManager role that can view and manage everything within their school — classrooms, students, teachers, feed, calendar — with a dedicated `/school/*` frontend route group.

**Architecture:** New `SchoolManager` Devise model with `belongs_to :school`, JWT auth (type `"SchoolManager"`), Permissionable concern. All existing policies get a `school_manager?` branch scoping to `user.school`. New GraphQL queries for school overview and teacher management. New mutations for teacher assignment and student transfer. Dedicated `/school/*` SvelteKit routes.

**Tech Stack:** Rails 8.1, GraphQL (graphql-ruby), Pundit policies, Devise + JWT, SvelteKit (Svelte 5), Tailwind CSS v4

---

## Phase 1: Backend Model & Auth

### Task 1: Create SchoolManager migration

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_create_school_managers.rb`

**Step 1: Generate migration**

Run: `bin/rails generate migration CreateSchoolManagers`

Then replace the migration content with:

```ruby
class CreateSchoolManagers < ActiveRecord::Migration[8.1]
  def change
    create_table :school_managers do |t|
      # Profile
      t.string :name, null: false
      t.string :phone
      t.text :bio
      t.date :birthdate
      t.string :gender
      t.string :qualification
      # Address
      t.string :address_line1
      t.string :address_line2
      t.string :city
      t.string :state_province
      t.string :postal_code
      t.string :country_code
      # School
      t.references :school, null: false, foreign_key: true
      # Devise
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""
      t.string :reset_password_token
      t.datetime :reset_password_sent_at
      t.datetime :remember_created_at

      t.timestamps
    end

    add_index :school_managers, :email, unique: true
    add_index :school_managers, :reset_password_token, unique: true
  end
end
```

**Step 2: Run migration**

Run: `bin/rails db:migrate`
Expected: Migration succeeds, `schema.rb` updated with `school_managers` table.

**Step 3: Commit**

```bash
git add backend/db/migrate/*_create_school_managers.rb backend/db/schema.rb
git commit -m "feat(school-manager): add school_managers table migration"
```

---

### Task 2: Create SchoolManager model

**Files:**
- Create: `backend/app/models/school_manager.rb`
- Modify: `backend/app/models/school.rb` (add `has_many :school_managers`)

**Step 1: Create model file**

```ruby
# backend/app/models/school_manager.rb
class SchoolManager < ApplicationRecord
  include PublicActivity::Model
  tracked

  devise :database_authenticatable, :recoverable, :rememberable, :validatable

  include Permissionable

  belongs_to :school
  has_many :refresh_tokens, as: :authenticatable, dependent: :destroy
  has_many :permissions, as: :permissionable, dependent: :destroy
  has_many :classroom_events, as: :creator, dependent: :nullify
  has_one_attached :avatar_image

  validates :name, presence: true

  def role
    "school_manager"
  end

  def school_manager?
    true
  end

  def teacher?
    false
  end

  def parent?
    false
  end

  def admin?
    false
  end

  def jwt_payload
    { "sub" => id, "type" => "SchoolManager" }
  end

  # Convenience: all classrooms in the school
  def school_classrooms
    school.classrooms
  end

  # Convenience: all classroom IDs in the school
  def school_classroom_ids
    school.classrooms.pluck(:id)
  end
end
```

**Step 2: Add association to School model**

In `backend/app/models/school.rb`, add after `has_many :teachers`:

```ruby
has_many :school_managers, dependent: :destroy
```

**Step 3: Verify model loads**

Run: `bin/rails runner "puts SchoolManager.new.role"`
Expected: `school_manager`

**Step 4: Commit**

```bash
git add backend/app/models/school_manager.rb backend/app/models/school.rb
git commit -m "feat(school-manager): add SchoolManager model with Devise and Permissionable"
```

---

### Task 3: Wire up auth (JWT + find_authenticatable + login)

**Files:**
- Modify: `backend/app/controllers/concerns/authenticatable.rb:61` — add `SchoolManager` to allowed classes
- Modify: `backend/app/graphql/mutations/login.rb:16` — add `school_manager` role branch
- Modify: `backend/app/graphql/mutations/register.rb:15` — add `school_manager` role branch (or skip — HoS shouldn't self-register)

**Step 1: Update `find_authenticatable`**

In `backend/app/controllers/concerns/authenticatable.rb`, change line 61:

```ruby
# FROM:
return nil unless klass && [ Teacher, Parent ].include?(klass)
# TO:
return nil unless klass && [ Teacher, Parent, SchoolManager ].include?(klass)
```

**Step 2: Update login mutation**

In `backend/app/graphql/mutations/login.rb`, change line 16:

```ruby
# FROM:
klass = (role == "teacher") ? Teacher : Parent
# TO:
klass = case role
         when "teacher" then Teacher
         when "school_manager" then SchoolManager
         else Parent
         end
```

**Step 3: Skip self-registration for SchoolManager**

SchoolManagers should be created by admins, not self-registered. No changes to register mutation needed — it only supports "teacher" and "parent" roles.

**Step 4: Write test for SchoolManager login**

Create `backend/test/graphql/mutations/school_manager_auth_test.rb`:

```ruby
require "test_helper"

class SchoolManagerAuthTest < ActiveSupport::TestCase
  test "school manager can log in" do
    manager = SchoolManager.create!(
      name: "Pat Principal",
      email: "pat@greenwood.edu",
      password: "password123",
      password_confirmation: "password123",
      school: schools(:greenwood)
    )

    result = execute_query(
      mutation: 'mutation($email: String!, $password: String!, $role: String!) {
        login(email: $email, password: $password, role: $role) {
          accessToken
          refreshToken
          expiresIn
          user { ... on SchoolManagerType { id name email role } }
          errors { message }
        }
      }',
      variables: { email: "pat@greenwood.edu", password: "password123", role: "school_manager" }
    )

    data = result.dig("data", "login")
    assert_not_nil data["accessToken"]
    assert_not_nil data["refreshToken"]
    assert_empty data["errors"]

    user = data["user"]
    assert_equal "Pat Principal", user["name"]
    assert_equal "school_manager", user["role"]
  end

  test "school manager login with wrong password fails" do
    SchoolManager.create!(
      name: "Pat Principal",
      email: "pat@greenwood.edu",
      password: "password123",
      password_confirmation: "password123",
      school: schools(:greenwood)
    )

    result = execute_query(
      mutation: 'mutation($email: String!, $password: String!, $role: String!) {
        login(email: $email, password: $password, role: $role) {
          accessToken
          errors { message }
        }
      }',
      variables: { email: "pat@greenwood.edu", password: "wrong", role: "school_manager" }
    )

    assert_nil result.dig("data", "login", "accessToken")
    assert result.dig("data", "login", "errors").any?
  end
end
```

**Step 5: Run test**

Run: `bin/rails test test/graphql/mutations/school_manager_auth_test.rb`
Expected: 2 tests pass (will fail until GraphQL type is created — see Task 4)

**Step 6: Commit**

```bash
git add backend/app/controllers/concerns/authenticatable.rb backend/app/graphql/mutations/login.rb backend/test/graphql/mutations/school_manager_auth_test.rb
git commit -m "feat(school-manager): wire up JWT auth and login mutation for SchoolManager"
```

---

### Task 4: Create SchoolManagerType and update UserUnion

**Files:**
- Create: `backend/app/graphql/types/school_manager_type.rb`
- Modify: `backend/app/graphql/types/user_union.rb` — add SchoolManagerType

**Step 1: Create GraphQL type**

```ruby
# backend/app/graphql/types/school_manager_type.rb
# frozen_string_literal: true

module Types
  class SchoolManagerType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :phone, String
    field :bio, String
    field :birthdate, GraphQL::Types::ISO8601Date
    field :gender, String
    field :qualification, String
    field :address_line1, String
    field :address_line2, String
    field :city, String
    field :state_province, String
    field :postal_code, String
    field :country_code, String
    field :avatar_url, String
    field :school, Types::SchoolType, null: false

    def avatar_url
      if object.avatar_image.attached?
        Rails.application.routes.url_helpers.url_for(object.avatar_image)
      end
    end
  end
end
```

**Step 2: Update UserUnion**

In `backend/app/graphql/types/user_union.rb`:

```ruby
# FROM:
possible_types Types::TeacherType, Types::ParentType

def self.resolve_type(object, context)
  case object
  when Teacher then Types::TeacherType
  when Parent then Types::ParentType
  else
    raise GraphQL::ExecutionError, "Unknown user type: #{object.class}"
  end
end

# TO:
possible_types Types::TeacherType, Types::ParentType, Types::SchoolManagerType

def self.resolve_type(object, context)
  case object
  when Teacher then Types::TeacherType
  when Parent then Types::ParentType
  when SchoolManager then Types::SchoolManagerType
  else
    raise GraphQL::ExecutionError, "Unknown user type: #{object.class}"
  end
end
```

**Step 3: Check if SchoolType exists**

Run: `ls backend/app/graphql/types/school_type.rb`

If it doesn't exist, create it:

```ruby
# backend/app/graphql/types/school_type.rb
# frozen_string_literal: true

module Types
  class SchoolType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
  end
end
```

**Step 4: Run auth tests**

Run: `bin/rails test test/graphql/mutations/school_manager_auth_test.rb`
Expected: 2 tests pass

**Step 5: Commit**

```bash
git add backend/app/graphql/types/school_manager_type.rb backend/app/graphql/types/user_union.rb backend/app/graphql/types/school_type.rb
git commit -m "feat(school-manager): add SchoolManagerType and update UserUnion"
```

---

### Task 5: Update role permissions defaults

**Files:**
- Modify: `backend/config/initializers/role_permissions.rb`
- Modify: `backend/app/models/permission.rb` — add new valid resources

**Step 1: Add school_manager defaults**

In `backend/config/initializers/role_permissions.rb`:

```ruby
module RolePermissions
  DEFAULTS = {
    "teacher" => {
      "classrooms" => %w[index show overview],
      "students" => %w[show radar progress],
      "daily_scores" => %w[index create update]
    },
    "parent" => {
      "students" => %w[show radar progress],
      "daily_scores" => %w[index],
      "children" => %w[index]
    },
    "school_manager" => {
      "classrooms" => %w[index show overview],
      "students" => %w[index show radar progress],
      "daily_scores" => %w[index],
      "feed_posts" => %w[index show create],
      "calendar_events" => %w[index create destroy],
      "teachers" => %w[index show manage],
      "school" => %w[show manage]
    },
    "admin" => :all
  }.freeze
end
```

**Step 2: Update Permission valid resources**

In `backend/app/models/permission.rb`, update:

```ruby
VALID_RESOURCES = %w[classrooms students daily_scores children feed_posts calendar_events teachers school].freeze
VALID_ACTIONS = %w[index show create update destroy overview radar progress manage].freeze
```

**Step 3: Commit**

```bash
git add backend/config/initializers/role_permissions.rb backend/app/models/permission.rb
git commit -m "feat(school-manager): add school_manager role permission defaults"
```

---

## Phase 2: Policy Updates

### Task 6: Update all policies for school_manager role

**Files:**
- Modify: `backend/app/policies/classroom_policy.rb`
- Modify: `backend/app/policies/student_policy.rb`
- Modify: `backend/app/policies/daily_score_policy.rb`
- Modify: `backend/app/policies/feed_post_policy.rb`
- Modify: `backend/app/policies/classroom_event_policy.rb`

**Step 1: Update ClassroomPolicy**

```ruby
# backend/app/policies/classroom_policy.rb
class ClassroomPolicy < ApplicationPolicy
  def index?
    permitted?(:index)
  end

  def show?
    permitted?(:show) && (user.admin? || user.school_manager? && school_classroom? || teaches_classroom?)
  end

  def overview?
    permitted?(:overview) && (user.admin? || user.school_manager? && school_classroom? || teaches_classroom?)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.where(school: user.school)
      elsif user.has_permission?("classrooms", "index")
        scope.joins(:classroom_teachers).where(classroom_teachers: { teacher_id: user.id })
      else
        scope.none
      end
    end
  end

  private

  def teaches_classroom?
    user.teacher? && record.classroom_teachers.exists?(teacher_id: user.id)
  end

  def school_classroom?
    record.school_id == user.school.id
  end
end
```

**Step 2: Update StudentPolicy**

```ruby
# backend/app/policies/student_policy.rb
class StudentPolicy < ApplicationPolicy
  def show?
    permitted?(:show) && (user.admin? || user.school_manager? && school_student? || teaches_student? || parents_student?)
  end

  def radar?
    permitted?(:radar) && (user.admin? || user.school_manager? && school_student? || teaches_student? || parents_student?)
  end

  def progress?
    permitted?(:progress) && (user.admin? || user.school_manager? && school_student? || teaches_student? || parents_student?)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.joins(classroom_students: :classroom)
          .merge(ClassroomStudent.current)
          .where(classrooms: { school_id: user.school_id })
      elsif user.teacher?
        scope.joins(classroom_students: { classroom: :classroom_teachers })
          .merge(ClassroomStudent.current)
          .where(classroom_teachers: { teacher_id: user.id })
      elsif user.parent?
        scope.joins(:parent_students).where(parent_students: { parent_id: user.id })
      else
        scope.none
      end
    end
  end

  private

  def teaches_student?
    user.teacher? && record.current_classroom&.classroom_teachers&.exists?(teacher_id: user.id)
  end

  def parents_student?
    user.parent? && user.children.exists?(record.id)
  end

  def school_student?
    record.current_classroom&.school_id == user.school_id
  end
end
```

**Step 3: Update DailyScorePolicy**

```ruby
# backend/app/policies/daily_score_policy.rb
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
      elsif user.school_manager?
        scope.joins(student: { classroom_students: :classroom })
          .merge(ClassroomStudent.current)
          .where(classrooms: { school_id: user.school_id })
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

**Step 4: Update FeedPostPolicy**

```ruby
# backend/app/policies/feed_post_policy.rb
class FeedPostPolicy < ApplicationPolicy
  def show?
    return true if user.admin?
    return true if user.teacher?
    return true if user.school_manager? && school_post?
    return false unless user.parent?

    user.children
      .joins(:classroom_students)
      .where(classroom_students: { classroom_id: record.classroom_id, status: :active })
      .exists?
  end

  def create?
    return true if user.school_manager? && school_post?
    user.teacher? && user.classrooms.exists?(id: record.classroom_id)
  end

  def destroy?
    user.teacher? && record.teacher_id == user.id
  end

  def like?
    show?
  end

  def comment?
    show?
  end

  private

  def school_post?
    Classroom.where(id: record.classroom_id, school_id: user.school_id).exists?
  end
end
```

**Step 5: Update ClassroomEventPolicy**

```ruby
# backend/app/policies/classroom_event_policy.rb
class ClassroomEventPolicy < ApplicationPolicy
  def show?
    classroom_member?
  end

  def create?
    classroom_member?
  end

  def destroy?
    record.creator_type == user.class.name && record.creator_id == user.id
  end

  private

  def classroom_member?
    if user.school_manager?
      Classroom.where(id: record.classroom_id, school_id: user.school_id).exists?
    elsif user.teacher?
      user.classrooms.exists?(id: record.classroom_id)
    elsif user.parent?
      user.children
        .joins(:classroom_students)
        .where(classroom_students: { classroom_id: record.classroom_id, status: :active })
        .exists?
    else
      false
    end
  end
end
```

**Step 6: Add `school_manager?` method to Teacher and Parent (returns false)**

Both Teacher and Parent already have `school_manager?` returning... actually they don't. We need to add it.

In `backend/app/models/teacher.rb`, add after `admin?`:

```ruby
def school_manager?
  false
end
```

In `backend/app/models/parent.rb`, add after `admin?`:

```ruby
def school_manager?
  false
end
```

**Step 7: Commit**

```bash
git add backend/app/policies/ backend/app/models/teacher.rb backend/app/models/parent.rb
git commit -m "feat(school-manager): update all policies with school_manager? branch"
```

---

### Task 7: Update GraphQL queries for school_manager

**Files:**
- Modify: `backend/app/graphql/types/query_type.rb` — update `classrooms`, `classroom_events`, `feed_posts` queries

**Step 1: Update `classrooms` query**

In `query_type.rb`, update the `classrooms` method:

```ruby
def classrooms
  authenticate!
  ClassroomPolicy::Scope.new(current_user, Classroom).resolve
    .includes(:classroom_teachers, :classroom_students)
end
```

This already works because we updated `ClassroomPolicy::Scope` in Task 6.

**Step 2: Update `classroom_events` query**

In `query_type.rb`, update the `classroom_events` method to handle `school_manager?`:

```ruby
def classroom_events(month:, classroom_ids: nil)
  authenticate!

  if current_user.teacher?
    ids = classroom_ids || current_user.classroom_ids
  elsif current_user.parent?
    child_classroom_ids = current_user.children
      .joins(:classroom_students)
      .where(classroom_students: { status: :active })
      .pluck("classroom_students.classroom_id")
      .uniq
    ids = classroom_ids ? (classroom_ids.map(&:to_i) & child_classroom_ids) : child_classroom_ids
  elsif current_user.school_manager?
    school_classroom_ids = current_user.school_classroom_ids
    ids = classroom_ids ? (classroom_ids.map(&:to_i) & school_classroom_ids) : school_classroom_ids
  else
    ids = []
  end

  ClassroomEvent.for_classroom_ids(ids).for_month(Date.parse(month.to_s))
    .order(event_date: :asc, start_time: :asc)
    .includes(:classroom, :creator)
end
```

**Step 3: Update `feed_posts` query**

In `query_type.rb`, update the `feed_posts` method:

```ruby
def feed_posts(classroom_ids: nil, student_ids: nil)
  authenticate!

  if current_user.school_manager?
    school_classroom_ids = current_user.school_classroom_ids
    ids = classroom_ids ? (classroom_ids.map(&:to_i) & school_classroom_ids) : school_classroom_ids
  elsif current_user.parent?
    child_classroom_ids = current_user.children
      .joins(:classroom_students)
      .where(classroom_students: { status: :active })
      .pluck("classroom_students.classroom_id")
      .uniq
    ids = classroom_ids ? (classroom_ids.map(&:to_i) & child_classroom_ids) : child_classroom_ids
  elsif current_user.teacher?
    ids = classroom_ids || current_user.classroom_ids
  else
    ids = []
  end

  scope = FeedPost.where(classroom_id: ids).order(created_at: :desc).includes(:teacher, :classroom, :tagged_students)

  if student_ids.present?
    scope = scope.joins(:feed_post_students).where(feed_post_students: { student_id: student_ids }).distinct
  end

  scope
end
```

**Step 4: Commit**

```bash
git add backend/app/graphql/types/query_type.rb
git commit -m "feat(school-manager): update GraphQL queries for school_manager scoping"
```

---

### Task 8: Add new GraphQL queries and mutations

**Files:**
- Create: `backend/app/graphql/types/school_overview_type.rb`
- Modify: `backend/app/graphql/types/query_type.rb` — add `schoolOverview`, `schoolTeachers`
- Create: `backend/app/graphql/mutations/assign_teacher_to_classroom.rb`
- Create: `backend/app/graphql/mutations/remove_teacher_from_classroom.rb`
- Create: `backend/app/graphql/mutations/transfer_student.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb` — register new mutations

**Step 1: Create SchoolOverviewType**

```ruby
# backend/app/graphql/types/school_overview_type.rb
# frozen_string_literal: true

module Types
  class SchoolOverviewType < Types::BaseObject
    field :school_name, String, null: false
    field :classroom_count, Integer, null: false
    field :student_count, Integer, null: false
    field :teacher_count, Integer, null: false
  end
end
```

**Step 2: Add queries to QueryType**

Add to `backend/app/graphql/types/query_type.rb` in the `# === School ===` section:

```ruby
# === School ===

field :school_overview, Types::SchoolOverviewType, null: false, description: "School overview stats (school_manager only)"

def school_overview
  authenticate!
  raise GraphQL::ExecutionError, "Only school managers can access this" unless current_user.school_manager?

  school = current_user.school
  OpenStruct.new(
    school_name: school.name,
    classroom_count: school.classrooms.count,
    student_count: Student.joins(classroom_students: :classroom)
      .merge(ClassroomStudent.current)
      .where(classrooms: { school_id: school.id })
      .distinct.count,
    teacher_count: school.teachers.count
  )
end

field :school_teachers, [ Types::TeacherType ], null: false, description: "All teachers in the school (school_manager only)"

def school_teachers
  authenticate!
  raise GraphQL::ExecutionError, "Only school managers can access this" unless current_user.school_manager?

  current_user.school.teachers.includes(:classrooms)
end
```

**Step 3: Create AssignTeacherToClassroom mutation**

```ruby
# backend/app/graphql/mutations/assign_teacher_to_classroom.rb
# frozen_string_literal: true

module Mutations
  class AssignTeacherToClassroom < BaseMutation
    argument :teacher_id, ID, required: true
    argument :classroom_id, ID, required: true
    argument :role, String, required: true, description: "primary, assistant, or substitute"

    field :classroom_teacher, Types::ClassroomTeacherType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(teacher_id:, classroom_id:, role:)
      authenticate!
      raise GraphQL::ExecutionError, "Only school managers can do this" unless current_user.school_manager?

      teacher = Teacher.find(teacher_id)
      classroom = Classroom.find(classroom_id)

      # Verify both belong to the same school
      unless teacher.school_id == current_user.school_id && classroom.school_id == current_user.school_id
        raise Pundit::NotAuthorizedError
      end

      ct = ClassroomTeacher.find_or_initialize_by(teacher: teacher, classroom: classroom)
      ct.role = role

      if ct.save
        { classroom_teacher: ct, errors: [] }
      else
        {
          classroom_teacher: nil,
          errors: ct.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
```

**Step 4: Create RemoveTeacherFromClassroom mutation**

```ruby
# backend/app/graphql/mutations/remove_teacher_from_classroom.rb
# frozen_string_literal: true

module Mutations
  class RemoveTeacherFromClassroom < BaseMutation
    argument :teacher_id, ID, required: true
    argument :classroom_id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(teacher_id:, classroom_id:)
      authenticate!
      raise GraphQL::ExecutionError, "Only school managers can do this" unless current_user.school_manager?

      ct = ClassroomTeacher.find_by!(teacher_id: teacher_id, classroom_id: classroom_id)

      # Verify belongs to the same school
      unless ct.classroom.school_id == current_user.school_id
        raise Pundit::NotAuthorizedError
      end

      ct.destroy!
      { success: true, errors: [] }
    end
  end
end
```

**Step 5: Create TransferStudent mutation**

```ruby
# backend/app/graphql/mutations/transfer_student.rb
# frozen_string_literal: true

module Mutations
  class TransferStudent < BaseMutation
    argument :student_id, ID, required: true
    argument :from_classroom_id, ID, required: true
    argument :to_classroom_id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(student_id:, from_classroom_id:, to_classroom_id:)
      authenticate!
      raise GraphQL::ExecutionError, "Only school managers can do this" unless current_user.school_manager?

      student = Student.find(student_id)
      from_classroom = Classroom.find(from_classroom_id)
      to_classroom = Classroom.find(to_classroom_id)

      # Verify both classrooms belong to the school
      unless from_classroom.school_id == current_user.school_id && to_classroom.school_id == current_user.school_id
        raise Pundit::NotAuthorizedError
      end

      # Deactivate current enrollment
      current_enrollment = ClassroomStudent.find_by!(student: student, classroom: from_classroom, status: :active)
      current_enrollment.update!(status: :transferred)

      # Create new enrollment
      new_enrollment = ClassroomStudent.create!(
        student: student,
        classroom: to_classroom,
        status: :active,
        academic_year: current_enrollment.academic_year,
        enrolled_at: Date.today
      )

      { success: true, errors: [] }
    end
  end
end
```

**Step 6: Check if ClassroomTeacherType exists, create if not**

```ruby
# backend/app/graphql/types/classroom_teacher_type.rb
# frozen_string_literal: true

module Types
  class ClassroomTeacherType < Types::BaseObject
    field :id, ID, null: false
    field :teacher, Types::TeacherType, null: false
    field :classroom, Types::ClassroomType, null: false
    field :role, String, null: false
  end
end
```

**Step 7: Register mutations in MutationType**

In `backend/app/graphql/types/mutation_type.rb`, add:

```ruby
# === School Management ===
field :assign_teacher_to_classroom, mutation: Mutations::AssignTeacherToClassroom
field :remove_teacher_from_classroom, mutation: Mutations::RemoveTeacherFromClassroom
field :transfer_student, mutation: Mutations::TransferStudent
```

**Step 8: Commit**

```bash
git add backend/app/graphql/
git commit -m "feat(school-manager): add school overview queries and management mutations"
```

---

### Task 9: Write backend tests for school_manager

**Files:**
- Create: `backend/test/graphql/mutations/school_manager_test.rb`
- Create: `backend/test/fixtures/school_managers.yml`

**Step 1: Create fixture**

```yaml
# backend/test/fixtures/school_managers.yml
<% require 'bcrypt' %>
manager_pat:
  name: Pat Principal
  email: pat@greenwood.test
  encrypted_password: <%= BCrypt::Password.create("password123") %>
  school: greenwood
```

**Step 2: Create test file**

```ruby
# backend/test/graphql/mutations/school_manager_test.rb
require "test_helper"

class SchoolManagerTest < ActiveSupport::TestCase
  # === schoolOverview query ===

  test "school manager sees school overview" do
    result = execute_query(
      query: '{ schoolOverview { schoolName classroomCount studentCount teacherCount } }',
      user: school_managers(:manager_pat)
    )

    overview = result.dig("data", "schoolOverview")
    assert_not_nil overview
    assert_equal "Greenwood Elementary", overview["schoolName"]
    assert overview["classroomCount"] > 0
    assert overview["teacherCount"] > 0
  end

  test "teacher cannot access school overview" do
    result = execute_query(
      query: '{ schoolOverview { schoolName } }',
      user: teachers(:teacher_alice)
    )

    assert result["errors"].any? { |e| e["message"].include?("school manager") }
  end

  # === classrooms query (school-wide) ===

  test "school manager sees all school classrooms" do
    result = execute_query(
      query: '{ classrooms { id name } }',
      user: school_managers(:manager_pat)
    )

    classrooms = result.dig("data", "classrooms")
    assert_not_nil classrooms
    # Should see both alice_class and bob_class
    names = classrooms.map { |c| c["name"] }
    assert_includes names, "Class 1A"
    assert_includes names, "Class 2B"
  end

  # === schoolTeachers query ===

  test "school manager sees all teachers" do
    result = execute_query(
      query: '{ schoolTeachers { id name email } }',
      user: school_managers(:manager_pat)
    )

    teachers = result.dig("data", "schoolTeachers")
    assert_not_nil teachers
    names = teachers.map { |t| t["name"] }
    assert_includes names, "Alice Teacher"
    assert_includes names, "Bob Teacher"
  end

  # === assignTeacherToClassroom mutation ===

  test "school manager assigns teacher to classroom" do
    result = execute_query(
      mutation: 'mutation($teacherId: ID!, $classroomId: ID!, $role: String!) {
        assignTeacherToClassroom(teacherId: $teacherId, classroomId: $classroomId, role: $role) {
          classroomTeacher { id role teacher { name } classroom { name } }
          errors { message }
        }
      }',
      variables: {
        teacherId: teachers(:teacher_bob).id.to_s,
        classroomId: classrooms(:alice_class).id.to_s,
        role: "assistant"
      },
      user: school_managers(:manager_pat)
    )

    ct = result.dig("data", "assignTeacherToClassroom", "classroomTeacher")
    errors = result.dig("data", "assignTeacherToClassroom", "errors")
    assert_empty errors
    assert_equal "assistant", ct["role"]
  end

  # === removeTeacherFromClassroom mutation ===

  test "school manager removes teacher from classroom" do
    result = execute_query(
      mutation: 'mutation($teacherId: ID!, $classroomId: ID!) {
        removeTeacherFromClassroom(teacherId: $teacherId, classroomId: $classroomId) {
          success
          errors { message }
        }
      }',
      variables: {
        teacherId: teachers(:teacher_alice).id.to_s,
        classroomId: classrooms(:alice_class).id.to_s
      },
      user: school_managers(:manager_pat)
    )

    assert_equal true, result.dig("data", "removeTeacherFromClassroom", "success")
  end

  # === transferStudent mutation ===

  test "school manager transfers student between classrooms" do
    result = execute_query(
      mutation: 'mutation($studentId: ID!, $fromClassroomId: ID!, $toClassroomId: ID!) {
        transferStudent(studentId: $studentId, fromClassroomId: $fromClassroomId, toClassroomId: $toClassroomId) {
          success
          errors { message }
        }
      }',
      variables: {
        studentId: students(:student_emma).id.to_s,
        fromClassroomId: classrooms(:alice_class).id.to_s,
        toClassroomId: classrooms(:bob_class).id.to_s
      },
      user: school_managers(:manager_pat)
    )

    assert_equal true, result.dig("data", "transferStudent", "success")

    # Verify old enrollment is transferred
    old = ClassroomStudent.find_by(student: students(:student_emma), classroom: classrooms(:alice_class))
    assert_equal "transferred", old.status

    # Verify new enrollment is active
    new_enrollment = ClassroomStudent.find_by(student: students(:student_emma), classroom: classrooms(:bob_class), status: :active)
    assert_not_nil new_enrollment
  end

  # === Authorization ===

  test "teacher cannot assign teachers" do
    result = execute_query(
      mutation: 'mutation($teacherId: ID!, $classroomId: ID!, $role: String!) {
        assignTeacherToClassroom(teacherId: $teacherId, classroomId: $classroomId, role: $role) {
          classroomTeacher { id }
          errors { message }
        }
      }',
      variables: {
        teacherId: teachers(:teacher_bob).id.to_s,
        classroomId: classrooms(:alice_class).id.to_s,
        role: "assistant"
      },
      user: teachers(:teacher_alice)
    )

    assert result["errors"].any? { |e| e["message"].include?("school manager") }
  end
end
```

**Step 3: Run tests**

Run: `bin/rails test test/graphql/mutations/school_manager_test.rb`
Expected: All tests pass

**Step 4: Run full test suite**

Run: `bin/rails test`
Expected: All tests pass (160 existing + new school manager tests)

**Step 5: Commit**

```bash
git add backend/test/
git commit -m "test(school-manager): add tests for school overview, teacher management, student transfer"
```

---

## Phase 3: Frontend

### Task 10: Update frontend auth for school_manager role

**Files:**
- Modify: `front-end/src/lib/api/types.ts` — add `SchoolManager` interface
- Modify: `front-end/src/hooks.server.ts` — add `/school` route guard
- Modify: `front-end/src/routes/login/+page.server.ts` — add school_manager redirect
- Modify: `front-end/src/routes/login/+page.svelte` — add school_manager role option

**Step 1: Add SchoolManager type**

In `front-end/src/lib/api/types.ts`, add after the `Parent` interface:

```typescript
export interface SchoolManager {
  id: string;
  name: string;
  email: string;
  role: 'school_manager';
  phone?: string | null;
  bio?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  qualification?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  avatarUrl?: string | null;
  school?: { id: string; name: string };
}

export type User = Teacher | Parent | SchoolManager;
```

**Step 2: Update hooks.server.ts**

Add `/school` route guard and update dashboard redirect:

```typescript
// Update the dashboard redirect for authenticated users on login page:
const dashboard = user.type === 'Teacher'
  ? '/teacher/dashboard'
  : user.type === 'SchoolManager'
    ? '/school/dashboard'
    : '/parent/dashboard';

// Add school route guard:
if (user && url.pathname.startsWith('/school') && user.type !== 'SchoolManager') {
  const fallback = user.type === 'Teacher' ? '/teacher/dashboard' : '/parent/dashboard';
  throw redirect(303, fallback);
}
```

**Step 3: Update login page**

In `front-end/src/routes/login/+page.server.ts`, update the dashboard redirect:

```typescript
const dashboard = role === 'teacher'
  ? '/teacher/dashboard'
  : role === 'school_manager'
    ? '/school/dashboard'
    : '/parent/dashboard';
```

In `front-end/src/routes/login/+page.svelte`, add a third role option radio button for "School Manager".

**Step 4: Commit**

```bash
git add front-end/src/lib/api/types.ts front-end/src/hooks.server.ts front-end/src/routes/login/
git commit -m "feat(school-manager): update frontend auth for school_manager role"
```

---

### Task 11: Create frontend GraphQL queries for school manager

**Files:**
- Create: `front-end/src/lib/api/queries/school.ts`

**Step 1: Create queries file**

```typescript
// front-end/src/lib/api/queries/school.ts

export const SCHOOL_OVERVIEW_QUERY = `
  query SchoolOverview {
    schoolOverview {
      schoolName
      classroomCount
      studentCount
      teacherCount
    }
  }
`;

export const SCHOOL_TEACHERS_QUERY = `
  query SchoolTeachers {
    schoolTeachers {
      id
      name
      email
      classrooms { id name }
    }
  }
`;

export const ASSIGN_TEACHER_MUTATION = `
  mutation AssignTeacher($teacherId: ID!, $classroomId: ID!, $role: String!) {
    assignTeacherToClassroom(teacherId: $teacherId, classroomId: $classroomId, role: $role) {
      classroomTeacher { id role teacher { name } classroom { name } }
      errors { message path }
    }
  }
`;

export const REMOVE_TEACHER_MUTATION = `
  mutation RemoveTeacher($teacherId: ID!, $classroomId: ID!) {
    removeTeacherFromClassroom(teacherId: $teacherId, classroomId: $classroomId) {
      success
      errors { message path }
    }
  }
`;

export const TRANSFER_STUDENT_MUTATION = `
  mutation TransferStudent($studentId: ID!, $fromClassroomId: ID!, $toClassroomId: ID!) {
    transferStudent(studentId: $studentId, fromClassroomId: $fromClassroomId, toClassroomId: $toClassroomId) {
      success
      errors { message path }
    }
  }
`;
```

**Step 2: Commit**

```bash
git add front-end/src/lib/api/queries/school.ts
git commit -m "feat(school-manager): add frontend GraphQL queries for school management"
```

---

### Task 12: Create /school/* route group with layout

**Files:**
- Create: `front-end/src/routes/school/+layout.server.ts`
- Create: `front-end/src/routes/school/+layout.svelte`

**Step 1: Create layout server**

Follow the pattern from `front-end/src/routes/teacher/+layout.server.ts`.

**Step 2: Create layout svelte**

Nav items: Dashboard, Classrooms, Teachers, Students, Feed, Calendar, Profile

**Step 3: Commit**

```bash
git add front-end/src/routes/school/
git commit -m "feat(school-manager): add /school route group with layout"
```

---

### Task 13: Create school dashboard page

**Files:**
- Create: `front-end/src/routes/school/dashboard/+page.server.ts`
- Create: `front-end/src/routes/school/dashboard/+page.svelte`

Dashboard shows: school name, stats cards (classrooms, students, teachers), list of all classrooms with student counts.

**Step 1: Create server load**

Fetch `schoolOverview` and `classrooms` in parallel.

**Step 2: Create page**

Stats cards at top, classroom grid below.

**Step 3: Commit**

```bash
git add front-end/src/routes/school/dashboard/
git commit -m "feat(school-manager): add school dashboard with overview stats"
```

---

### Task 14: Create school classrooms, teachers, students, feed, calendar, profile pages

**Files:**
- Create: `front-end/src/routes/school/classrooms/+page.server.ts` + `+page.svelte`
- Create: `front-end/src/routes/school/teachers/+page.server.ts` + `+page.svelte`
- Create: `front-end/src/routes/school/students/+page.server.ts` + `+page.svelte`
- Create: `front-end/src/routes/school/feed/+page.server.ts` + `+page.svelte`
- Create: `front-end/src/routes/school/calendar/+page.server.ts` + `+page.svelte`
- Create: `front-end/src/routes/school/profile/+page.server.ts` + `+page.svelte`

These pages follow the same patterns as teacher pages but with school-wide data. The teachers page adds assign/remove functionality. The students page adds transfer functionality.

**Step 1-6: Create each page pair**

Each page follows the established pattern:
- `+page.server.ts`: fetch data via `graphql()` with `locals.accessToken`
- `+page.svelte`: Svelte 5 with `$props()`, `$state()`, Card/Button/Input/Alert components

**Step 7: Commit**

```bash
git add front-end/src/routes/school/
git commit -m "feat(school-manager): add all school management pages"
```

---

## Phase 4: Seeds & Verification

### Task 15: Add seed data and run full verification

**Files:**
- Modify: `backend/db/seeds.rb` — add SchoolManager seed

**Step 1: Add seed**

After the AdminUser creation in seeds.rb:

```ruby
# School Manager
pat = SchoolManager.create!(name: "Pat Principal", email: "pat@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)
```

Update the puts at the end:

```ruby
puts "School Manager login:"
puts "  pat@greenwood.edu / password123 (Greenwood Elementary — full school access)"
```

**Step 2: Run full backend test suite**

Run: `bin/rails test`
Expected: All tests pass

**Step 3: Run svelte-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json` (from front-end/)
Expected: 0 errors

**Step 4: Run build**

Run: `npm run build` (from front-end/)
Expected: Build succeeds

**Step 5: Commit and push**

```bash
git add backend/db/seeds.rb
git commit -m "feat(school-manager): add seed data for school manager"
git push origin main
```
