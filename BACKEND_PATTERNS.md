# GrewMe Backend — Exact File Patterns & Conventions

**Project:** Rails 8.1.2 with GraphQL API, Pundit authorization, Solid Queue jobs, ActionCable  
**Location:** `/Users/theresiaputri/repo/grewme/backend`  
**Last Updated:** 2026-03-15

---

## 1. MODEL PATTERN

**File:** `backend/app/models/daily_score.rb`

```ruby
class DailyScore < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :student
  belongs_to :teacher

  enum :skill_category, { reading: 0, math: 1, writing: 2, logic: 3, social: 4 }

  validates :date, presence: true
  validates :skill_category, presence: true
  validates :score, presence: true, numericality: { only_integer: true, in: 0..100 }
  validates :student_id, uniqueness: { scope: [ :date, :skill_category ], message: "already has a score for this skill on this date" }

  after_commit :invalidate_caches, on: [ :create, :update, :destroy ]
  after_commit :schedule_radar_refresh, on: [ :create, :update ]

  private

  def schedule_radar_refresh
    RefreshRadarSummaryJob.perform_later if defined?(RefreshRadarSummaryJob)
  end

  def invalidate_caches
    Rails.cache.delete("student_radar/#{student_id}")
    Rails.cache.delete("student_progress/#{student_id}")
    # Invalidate classroom overviews for all classrooms this student belongs to
    student.classroom_students.where(status: :active).pluck(:classroom_id).each do |cid|
      Rails.cache.delete("classroom_overview/#{cid}")
    end
  end
end
```

**Key Patterns:**
- Include `PublicActivity::Model` for audit tracking
- Use `tracked` to enable activity logging
- Use `enum` for categorical fields (not string columns)
- Validations: presence, numericality, uniqueness with scopes
- `after_commit` hooks for cache invalidation and async jobs
- Private methods for internal logic

---

## 2. NOTIFICATION MODEL (Polymorphic Example)

**File:** `backend/app/models/notification.rb`

```ruby
class Notification < ApplicationRecord
  KINDS = %w[
    leave_request_created
    leave_request_reviewed
    teacher_leave_request_created
    teacher_leave_request_reviewed
    classroom_event_created
    feed_post_tagged
    feed_post_created
    exam_submitted
    exam_grading_complete
    new_message
    new_comment
    health_checkup_reminder
  ].freeze

  belongs_to :recipient, polymorphic: true
  belongs_to :notifiable, polymorphic: true

  validates :title, presence: true
  validates :body, presence: true
  validates :kind, inclusion: { in: KINDS }, allow_nil: true

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }

  after_commit :invalidate_unread_count

  def read?
    read_at.present?
  end

  def mark_as_read!
    update!(read_at: Time.current) unless read?
  end

  private

  def invalidate_unread_count
    Rails.cache.delete("unread_count/#{recipient_type}/#{recipient_id}")
  end
end
```

**Key Patterns:**
- Polymorphic associations: `belongs_to :recipient, polymorphic: true`
- Constants for enum-like values (KINDS)
- Scopes for common queries
- Instance methods for business logic
- Cache invalidation on commit

---

## 3. SCHOOL MODEL (With Validations & Methods)

**File:** `backend/app/models/school.rb`

```ruby
class School < ApplicationRecord
  include PublicActivity::Model

  tracked

  has_many :classrooms, dependent: :destroy
  has_many :subjects, dependent: :destroy
  has_many :teachers, dependent: :nullify
  has_many :school_managers, dependent: :destroy
  has_many :academic_years, dependent: :destroy
  has_many :invitations, dependent: :destroy
  has_many :teacher_leave_requests, dependent: :destroy

  validates :name, presence: true
  validates :min_grade, :max_grade, presence: true,
    numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 12 }
  validate :max_grade_gte_min_grade

  def grade_range
    min_grade..max_grade
  end

  def grade_display_name(grade)
    case grade
    when 1..6 then "ELM #{grade}"
    when 7..9 then "JHS #{grade - 6}"
    when 10..12 then "SHS #{grade - 9}"
    end
  end

  validates :country_code, inclusion: { in: ->(_) { ISO3166::Country.codes }, message: "is not a valid ISO 3166-1 alpha-2 code" },
    allow_blank: true

  def full_address
    [ address_line1, address_line2, city, state_province, postal_code, country_name ].compact_blank.join(", ")
  end

  def country_name
    return nil if country_code.blank?
    ISO3166::Country.new(country_code)&.common_name || ISO3166::Country.new(country_code)&.name
  end

  private

  def max_grade_gte_min_grade
    errors.add(:max_grade, "must be >= min_grade") if max_grade && min_grade && max_grade < min_grade
  end
end
```

**Key Patterns:**
- Custom validators with `validate :method_name`
- Helper methods for display logic
- Dependent destroy/nullify for associations
- Custom validation error messages

---

## 4. STUDENT MODEL (With Scopes & Methods)

**File:** `backend/app/models/student.rb`

```ruby
class Student < ApplicationRecord
  include PublicActivity::Model

  tracked

  has_many :classroom_students, dependent: :destroy
  has_many :classrooms, through: :classroom_students
  has_many :parent_students, dependent: :destroy
  has_many :parents, through: :parent_students, source: :parent
  has_many :daily_scores, dependent: :destroy
  has_many :health_checkups, dependent: :destroy
  has_many :exam_submissions, dependent: :destroy
  has_many :objective_masteries, dependent: :destroy
  has_many :attendances, dependent: :destroy
  has_many :leave_requests, dependent: :destroy

  encrypts :name

  validates :name, presence: true

  def current_classroom
    classroom_students.current.includes(:classroom).first&.classroom
  end

  def current_enrollment
    classroom_students.current.first
  end

  def enroll!(classroom, academic_year:, enrolled_at: Date.current)
    # Deactivate any current enrollment
    current_enrollment&.deactivate!

    classroom_students.create!(
      classroom: classroom,
      academic_year: academic_year,
      enrolled_at: enrolled_at,
      status: :active
    )
  end

  def radar_data(start_date: nil, end_date: nil)
    scope = daily_scores
    scope = scope.where("date >= ?", start_date) if start_date
    scope = scope.where("date <= ?", end_date) if end_date
    scope.group(:skill_category).average(:score)
  end
end
```

**Key Patterns:**
- `encrypts :field` for PII (name, email)
- Through associations for many-to-many
- Methods that return single objects use `&.` safe navigation
- Methods with optional parameters use keyword arguments
- Scopes are called on associations (e.g., `classroom_students.current`)

---

## 5. CLASSROOM MODEL

**File:** `backend/app/models/classroom.rb`

```ruby
class Classroom < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :school

  has_many :classroom_teachers, dependent: :destroy
  has_many :teachers, through: :classroom_teachers
  has_many :classroom_students, dependent: :destroy
  has_many :students, -> { merge(ClassroomStudent.current) }, through: :classroom_students
  has_many :feed_posts, dependent: :destroy
  has_many :classroom_events, dependent: :destroy
  has_many :classroom_exams, dependent: :destroy
  has_many :exams, through: :classroom_exams
  has_many :attendances, dependent: :destroy

  validates :name, presence: true
  validates :grade, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 12 }, allow_nil: true

  def primary_teacher
    classroom_teachers.primary.first&.teacher
  end

  def teacher_ids
    classroom_teachers.pluck(:teacher_id)
  end
end
```

**Key Patterns:**
- Through associations with scopes: `has_many :students, -> { merge(ClassroomStudent.current) }, through: :classroom_students`
- Helper methods for common queries (primary_teacher, teacher_ids)

---

## 6. TEACHER MODEL (With Devise & Permissionable)

**File:** `backend/app/models/teacher.rb`

```ruby
class Teacher < ApplicationRecord
  include PublicActivity::Model

  tracked

  devise :database_authenticatable, :registerable, :recoverable, :validatable

  include Permissionable

  belongs_to :school, optional: true

  has_many :classroom_teachers, dependent: :destroy
  has_many :classrooms, through: :classroom_teachers
  has_many :daily_scores, foreign_key: :teacher_id, dependent: :destroy, inverse_of: :teacher
  has_many :health_checkups, dependent: :destroy
  has_many :refresh_tokens, as: :authenticatable, dependent: :destroy
  has_many :permissions, as: :permissionable, dependent: :destroy
  has_many :feed_posts, dependent: :destroy
  has_many :classroom_events, as: :creator, dependent: :destroy
  has_many :notifications, as: :recipient, dependent: :destroy
  has_many :push_devices, as: :user, dependent: :destroy
  has_many :conversations, dependent: :destroy
  has_many :reviewed_leave_requests, class_name: "LeaveRequest", foreign_key: :reviewed_by_id, dependent: :nullify
  has_many :teacher_leave_requests, dependent: :destroy
  has_many :substitute_assignments, class_name: "TeacherLeaveRequest", foreign_key: :substitute_id, dependent: :nullify

  has_one_attached :avatar_image

  encrypts :name
  encrypts :email, deterministic: true

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

  def school_manager?
    false
  end

  def jwt_payload
    { "sub" => id, "type" => "Teacher", "name" => name, "email" => email }
  end
end
```

**Key Patterns:**
- Devise for authentication
- Polymorphic associations: `as: :recipient`, `as: :creator`, `as: :user`
- Custom foreign keys: `foreign_key: :teacher_id`
- Role helper methods (teacher?, parent?, admin?, school_manager?)
- JWT payload method for token generation
- Encrypted fields with `deterministic: true` for email (searchable)

---

## 7. MIGRATION PATTERN

**File:** `backend/db/migrate/20260310115453_add_kahoot_exam_access.rb`

```ruby
class AddKahootExamAccess < ActiveRecord::Migration[8.1]
  def change
    safety_assured do
      add_column :classroom_exams, :access_code, :string, limit: 6
      add_column :classroom_exams, :duration_minutes, :integer
      add_column :classroom_exams, :show_results, :boolean, default: false, null: false

      add_index :classroom_exams, :access_code, unique: true

      add_column :exam_submissions, :auto_submitted, :boolean, default: false, null: false
      add_column :exam_submissions, :session_token, :string

      add_index :exam_submissions, :session_token, unique: true
    end
  end
end
```

**Key Patterns:**
- Class name matches file name (CamelCase)
- Inherit from `ActiveRecord::Migration[8.1]`
- Use `safety_assured` block for schema changes
- Add indexes for unique columns
- Set defaults and null constraints
- Use `change` method (reversible)

---

## 8. GRAPHQL MUTATION PATTERN (Single Create)

**File:** `backend/app/graphql/mutations/create_daily_score.rb`

```ruby
module Mutations
  class CreateDailyScore < BaseMutation
    argument :input, Types::CreateDailyScoreInputType, required: true

    field :daily_score, Types::DailyScoreType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!

      daily_score = DailyScore.new(input.to_h)
      daily_score.teacher = current_user

      student = Student.find(input.student_id)
      raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?
      raise Pundit::NotAuthorizedError unless DailyScorePolicy.new(current_user, daily_score).create?

      if daily_score.save
        AuditLogger.log(
          event_type: :SCORE_CREATE,
          action: "create_daily_score",
          user: current_user,
          resource: daily_score,
          request: context[:request]
        )
        { daily_score: daily_score, errors: [] }
      else
        {
          daily_score: nil,
          errors: daily_score.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
```

**Key Patterns:**
- Inherit from `BaseMutation`
- Arguments use input types
- Fields define return types
- `authenticate!` at start
- Authorization checks with Pundit
- Audit logging on success
- Return hash with data and errors
- Error messages mapped with camelCase paths

---

## 9. GRAPHQL MUTATION PATTERN (Bulk Create)

**File:** `backend/app/graphql/mutations/bulk_create_daily_scores.rb`

```ruby
module Mutations
  class BulkCreateDailyScores < BaseMutation
    argument :classroom_id, ID, required: true
    argument :date, GraphQL::Types::ISO8601Date, required: true
    argument :skill_category, Types::SkillCategoryEnum, required: true
    argument :scores, [ Types::BulkScoreInputType ], required: true

    field :daily_scores, [ Types::DailyScoreType ], null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(classroom_id:, date:, skill_category:, scores:)
      authenticate!

      classroom = Classroom.find(classroom_id)
      raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).show?

      created = []
      all_errors = []

      scores.each do |score_input|
        student = Student.find(score_input.student_id)
        raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?

        daily_score = DailyScore.find_or_initialize_by(
          student_id: score_input.student_id,
          date: date,
          skill_category: skill_category
        )
        daily_score.score = score_input.score
        daily_score.teacher = current_user

        raise Pundit::NotAuthorizedError unless DailyScorePolicy.new(current_user, daily_score).create?

        if daily_score.save
          created << daily_score
        else
          daily_score.errors.each do |e|
            all_errors << { message: "#{student.name}: #{e.full_message}", path: [ score_input.student_id ] }
          end
        end
      end

      { daily_scores: created, errors: all_errors }
    end
  end
end
```

**Key Patterns:**
- Bulk operations iterate and collect results
- Use `find_or_initialize_by` for upsert logic
- Collect errors per item with context (student name)
- Return arrays of created records and errors
- Authorization checks per item

---

## 10. GRAPHQL INPUT TYPE PATTERN

**File:** `backend/app/graphql/types/create_daily_score_input_type.rb`

```ruby
module Types
  class CreateDailyScoreInputType < Types::BaseInputObject
    argument :student_id, ID, required: true
    argument :date, GraphQL::Types::ISO8601Date, required: true
    argument :skill_category, Types::SkillCategoryEnum, required: true
    argument :score, Integer, required: true
    argument :notes, String, required: false
  end
end
```

**File:** `backend/app/graphql/types/update_daily_score_input_type.rb`

```ruby
module Types
  class UpdateDailyScoreInputType < Types::BaseInputObject
    argument :score, Integer, required: false
    argument :notes, String, required: false
  end
end
```

**Key Patterns:**
- Inherit from `Types::BaseInputObject`
- Use `argument` (not `field`) for input types
- Specify required/optional
- Use GraphQL scalar types (ID, String, Integer, ISO8601Date)
- Use custom enums for categorical fields

---

## 11. GRAPHQL ENUM PATTERN

**File:** `backend/app/graphql/types/skill_category_enum.rb`

```ruby
module Types
  class SkillCategoryEnum < Types::BaseEnum
    value "READING", value: "reading"
    value "MATH", value: "math"
    value "WRITING", value: "writing"
    value "LOGIC", value: "logic"
    value "SOCIAL", value: "social"
  end
end
```

**Key Patterns:**
- Inherit from `Types::BaseEnum`
- GraphQL name (UPPERCASE) maps to Ruby value (lowercase)
- Matches model enum values

---

## 12. GRAPHQL TYPE PATTERN

**File:** `backend/app/graphql/types/daily_score_type.rb`

```ruby
module Types
  class DailyScoreType < Types::BaseObject
    field :id, ID, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :skill_category, Types::SkillCategoryEnum, null: false
    field :score, Integer, null: false
    field :notes, String
    field :student_id, ID, null: false
    field :student, Types::StudentType, null: false
    field :teacher, Types::TeacherType, null: false
  end
end
```

**Key Patterns:**
- Inherit from `Types::BaseObject`
- Use `field` for output types
- Specify null: false for required fields
- Include IDs and associations
- Use custom types for related objects

---

## 13. GRAPHQL QUERY PATTERN (First 50 lines)

**File:** `backend/app/graphql/types/query_type.rb`

```ruby
module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [ Types::NodeType, null: true ], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ ID ], required: true, description: "IDs of the objects."
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    # === Auth ===

    field :me, Types::UserUnion, null: false, description: "Current authenticated user"

    def me
      authenticate!
      current_user
    end

    # === Classrooms ===

    field :classrooms, [ Types::ClassroomType ], null: false, description: "List classrooms for current teacher"

    def classrooms
      authenticate!
      ClassroomPolicy::Scope.new(current_user, Classroom).resolve
        .includes(:classroom_teachers, classroom_students: { student: :parents })
    end

    field :classroom, Types::ClassroomType, null: false, description: "Get a single classroom" do
      argument :id, ID, required: true
    end

    def classroom(id:)
      authenticate!
      classroom = Classroom.find(id)
      raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).show?
      classroom
```

**Key Patterns:**
- Inherit from `Types::BaseObject`
- Define field with type and description
- Implement resolver method with same name
- Use `authenticate!` for protected queries
- Use Pundit scopes for authorization
- Include eager loading (`.includes`)
- Comments organize sections

---

## 14. PUNDIT POLICY PATTERN

**File:** `backend/app/policies/daily_score_policy.rb`

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

**File:** `backend/app/policies/application_policy.rb`

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

  def permitted?(action)
    user.has_permission?(resource_name, action)
  end

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

**Key Patterns:**
- Inherit from `ApplicationPolicy`
- Action methods return boolean
- Use `permitted?(:action)` to check permission table
- Scope class for filtering queries
- Role-based filtering (admin, school_manager, teacher, parent)
- Private helper methods for complex logic

---

## 15. ACTIONCABLE CHANNEL PATTERN

**File:** `backend/app/channels/notifications_channel.rb`

```ruby
class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
  end

  def unsubscribed
    # Cleanup when channel is unsubscribed
  end
end
```

**File:** `backend/app/channels/chat_channel.rb`

```ruby
class ChatChannel < ApplicationCable::Channel
  def subscribed
    conversation = Conversation.find(params[:conversation_id])

    unless conversation.parent_id == current_user.id || conversation.teacher_id == current_user.id
      reject
      return
    end

    stream_for conversation
  end

  def unsubscribed
    # Cleanup when channel is unsubscribed
  end
end
```

**Key Patterns:**
- Inherit from `ApplicationCable::Channel`
- `subscribed` method for setup
- `stream_for` to broadcast to specific users/records
- Authorization checks before streaming
- `reject` to deny subscription
- `unsubscribed` for cleanup

---

## 16. SOLID QUEUE JOB PATTERN

**File:** `backend/app/jobs/application_job.rb`

```ruby
class ApplicationJob < ActiveJob::Base
  # Automatically retry jobs that encountered a deadlock
  retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3

  # Most jobs are safe to ignore if the underlying records are no longer available
  discard_on ActiveJob::DeserializationError
end
```

**File:** `backend/app/jobs/refresh_radar_summary_job.rb`

```ruby
class RefreshRadarSummaryJob < ApplicationJob
  queue_as :low

  limits_concurrency to: 1, key: -> { "radar-refresh" }

  def perform
    StudentRadarSummary.refresh
  end
end
```

**Key Patterns:**
- Inherit from `ApplicationJob`
- `queue_as :queue_name` to specify queue
- `limits_concurrency` to prevent parallel execution
- `perform` method is the job logic
- Retry on deadlock, discard on deserialization error
- Use `perform_later` to enqueue

---

## 17. MODEL TEST PATTERN

**File:** `backend/test/models/daily_score_test.rb`

```ruby
require "test_helper"

class DailyScoreTest < ActiveSupport::TestCase
  test "validates date presence" do
    score = DailyScore.new(student: students(:student_emma), teacher: teachers(:teacher_alice), skill_category: :reading, score: 80, date: nil)
    assert_not score.valid?
    assert_includes score.errors[:date], "can't be blank"
  end

  test "validates skill_category presence" do
    score = DailyScore.new(student: students(:student_emma), teacher: teachers(:teacher_alice), date: Date.new(2026, 3, 10), score: 80, skill_category: nil)
    assert_not score.valid?
    assert_includes score.errors[:skill_category], "can't be blank"
  end

  test "validates score presence" do
    score = DailyScore.new(student: students(:student_emma), teacher: teachers(:teacher_alice), date: Date.new(2026, 3, 10), skill_category: :reading, score: nil)
    assert_not score.valid?
  end

  test "score must be between 0 and 100" do
    base = { student: students(:student_finn), teacher: teachers(:teacher_alice), date: Date.new(2026, 3, 10), skill_category: :reading }

    score_neg = DailyScore.new(base.merge(score: -1))
    assert_not score_neg.valid?

    score_over = DailyScore.new(base.merge(score: 101))
    assert_not score_over.valid?

    score_zero = DailyScore.new(base.merge(score: 0))
    assert score_zero.valid?

    score_max = DailyScore.new(base.merge(score: 100))
    assert score_max.valid?
  end

  test "score must be integer" do
    score = DailyScore.new(student: students(:student_finn), teacher: teachers(:teacher_alice), date: Date.new(2026, 3, 10), skill_category: :reading, score: 85.5)
    assert_not score.valid?
  end

  test "unique per student per date per skill" do
    existing = daily_scores(:emma_reading_day1)
    duplicate = DailyScore.new(
      student: existing.student,
      teacher: existing.teacher,
      date: existing.date,
      skill_category: existing.skill_category,
      score: 90
    )
    assert_not duplicate.valid?
  end

  test "skill_category enum has 5 entries" do
    assert_equal 5, DailyScore.skill_categories.size
    assert_equal %w[reading math writing logic social], DailyScore.skill_categories.keys
  end

  test "belongs to student and teacher" do
    score = daily_scores(:emma_reading_day1)
    assert_equal students(:student_emma), score.student
    assert_equal teachers(:teacher_alice), score.teacher
  end
end
```

**Key Patterns:**
- Inherit from `ActiveSupport::TestCase`
- Use `test "description"` blocks
- Use fixtures: `students(:student_emma)`, `daily_scores(:emma_reading_day1)`
- Test validations with `assert_not score.valid?`
- Test error messages with `assert_includes score.errors[:field]`
- Test associations with `assert_equal`
- Test enum with `.skill_categories`

---

## 18. GRAPHQL MUTATION TEST PATTERN

**File:** `backend/test/graphql/mutations/daily_scores_test.rb`

```ruby
require "test_helper"

class DailyScoresMutationTest < ActiveSupport::TestCase
  CREATE_MUTATION = <<~GRAPHQL
    mutation($input: CreateDailyScoreInput!) {
      createDailyScore(input: $input) {
        dailyScore { id score skillCategory date studentId }
        errors { message path }
      }
    }
  GRAPHQL

  UPDATE_MUTATION = <<~GRAPHQL
    mutation($id: ID!, $input: UpdateDailyScoreInput!) {
      updateDailyScore(id: $id, input: $input) {
        dailyScore { id score notes }
        errors { message path }
      }
    }
  GRAPHQL

  test "teacher creates daily score for their student" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: {
        input: {
          studentId: student.id.to_s,
          date: "2026-03-05",
          skillCategory: "WRITING",
          score: 88
        }
      },
      user: teacher
    )

    data = gql_data(result)["createDailyScore"]
    assert_empty data["errors"]
    assert_equal 88, data["dailyScore"]["score"]
    assert_equal "WRITING", data["dailyScore"]["skillCategory"]
  end

  test "returns errors for invalid score" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: {
        input: {
          studentId: student.id.to_s,
          date: "2026-03-05",
          skillCategory: "READING",
          score: 999
        }
      },
      user: teacher
    )

    data = gql_data(result)["createDailyScore"]
    assert_nil data["dailyScore"]
    assert_not_empty data["errors"]
  end

  test "teacher updates their own score" do
    teacher = teachers(:teacher_alice)
    score = daily_scores(:emma_reading_day1)
    result = execute_query(
      mutation: UPDATE_MUTATION,
      variables: {
        id: score.id.to_s,
        input: { score: 95, notes: "Updated" }
      },
      user: teacher
    )

    data = gql_data(result)["updateDailyScore"]
    assert_empty data["errors"]
    assert_equal 95, data["dailyScore"]["score"]
    assert_equal "Updated", data["dailyScore"]["notes"]
  end

  test "teacher cannot update another teachers score" do
    teacher = teachers(:teacher_alice)
    score = daily_scores(:grace_reading_day1)
    result = execute_query(
      mutation: UPDATE_MUTATION,
      variables: {
        id: score.id.to_s,
        input: { score: 50 }
      },
      user: teacher
    )

    assert_not_nil gql_errors(result)
    assert_match "Not authorized", gql_errors(result).first["message"]
  end

  test "errors when unauthenticated" do
    student = students(:student_emma)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: {
        input: {
          studentId: student.id.to_s,
          date: "2026-03-05",
          skillCategory: "READING",
          score: 85
        }
      }
    )

    assert_not_nil gql_errors(result)
  end
end
```

**Key Patterns:**
- Define mutations as heredoc strings
- Use `execute_query(mutation:, variables:, user:)` helper
- Use `gql_data(result)` to extract data
- Use `gql_errors(result)` to extract errors
- Test success path (empty errors)
- Test validation errors
- Test authorization (Pundit)
- Test unauthenticated access

---

## 19. TEST FIXTURES PATTERN

**File:** `backend/test/fixtures/daily_scores.yml`

```yaml
emma_reading_day1:
  student: student_emma
  teacher: teacher_alice
  date: 2026-03-01
  skill_category: 0
  score: 85
  notes: "Good reading progress"

emma_math_day1:
  student: student_emma
  teacher: teacher_alice
  date: 2026-03-01
  skill_category: 1
  score: 72
  notes: ""

grace_reading_day1:
  student: student_grace
  teacher: teacher_bob
  date: 2026-03-01
  skill_category: 0
  score: 90
  notes: ""
```

**Key Patterns:**
- YAML format with fixture names as keys
- Reference other fixtures by name (student: student_emma)
- Enum values as integers (skill_category: 0 = reading)
- Empty strings for optional fields
- Fixture names follow pattern: `{entity}_{variant}`

---

## 20. SEED DATA PATTERN

**File:** `backend/db/seeds.rb` (first 50 lines)

```ruby
puts "Seeding database..."

# School
school = School.create!(
  name: "Greenwood Elementary",
  address_line1: "123 Oak Street",
  city: "Portland",
  state_province: "Oregon",
  postal_code: "97201",
  country_code: "US"
)

# Teachers (4 total)
alice = Teacher.create!(name: "Alice Teacher", email: "alice@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)
bob = Teacher.create!(name: "Bob Teacher", email: "bob@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)
charlie = Teacher.create!(name: "Charlie Teacher", email: "charlie@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)
diana = Teacher.create!(name: "Diana Teacher", email: "diana@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)

# Parents (12 total)
carol = Parent.create!(name: "Carol Parent", email: "carol@parent.com", password: "password123", password_confirmation: "password123")
dan = Parent.create!(name: "Dan Parent", email: "dan@parent.com", password: "password123", password_confirmation: "password123")
eve = Parent.create!(name: "Eve Parent", email: "eve@parent.com", password: "password123", password_confirmation: "password123")
frank = Parent.create!(name: "Frank Parent", email: "frank@parent.com", password: "password123", password_confirmation: "password123")
grace_p = Parent.create!(name: "Grace Parent", email: "grace@parent.com", password: "password123", password_confirmation: "password123")
hana = Parent.create!(name: "Hana Parent", email: "hana@parent.com", password: "password123", password_confirmation: "password123")
ivan = Parent.create!(name: "Ivan Parent", email: "ivan@parent.com", password: "password123", password_confirmation: "password123")
julia = Parent.create!(name: "Julia Parent", email: "julia@parent.com", password: "password123", password_confirmation: "password123")
kevin = Parent.create!(name: "Kevin Parent", email: "kevin@parent.com", password: "password123", password_confirmation: "password123")
lisa = Parent.create!(name: "Lisa Parent", email: "lisa@parent.com", password: "password123", password_confirmation: "password123")
mike = Parent.create!(name: "Mike Parent", email: "mike@parent.com", password: "password123", password_confirmation: "password123")
nina = Parent.create!(name: "Nina Parent", email: "nina@parent.com", password: "password123", password_confirmation: "password123")

# Admin user for Avo
AdminUser.create!(email: "admin@grewme.app", password: "password123", password_confirmation: "password123")

# School Manager
SchoolManager.create!(name: "Pat Principal", email: "pat@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)

# 7 Classrooms — Alice gets 4, others get 1 each
class1a = Classroom.create!(name: "Class 1A", school: school, grade: 1)
class1b = Classroom.create!(name: "Class 1B", school: school, grade: 1)
class2a = Classroom.create!(name: "Class 2A", school: school, grade: 2)
class2b = Classroom.create!(name: "Class 2B", school: school, grade: 2)
class3a = Classroom.create!(name: "Class 3A", school: school, grade: 3)
class3b = Classroom.create!(name: "Class 3B", school: school, grade: 3)
class4a = Classroom.create!(name: "Class 4A", school: school, grade: 4)

# Assign teachers to classrooms
# Alice: primary in 1A, 3A, 3B, 4A (4 classes)
ClassroomTeacher.create!(classroom: class1a, teacher: alice, role: "primary")
```

**Key Patterns:**
- Use `create!` (with bang) to fail fast on errors
- Store references in variables for associations
- Comments organize sections
- Consistent naming (alice, bob, carol, etc.)
- Use `puts` for progress messages

---

## 21. ROUTES PATTERN

**File:** `backend/config/routes.rb`

```ruby
Rails.application.routes.draw do
  # Action Cable WebSocket
  mount ActionCable.server => "/cable"

  # Avo admin panel
  mount_avo

  # Avo admin authentication
  get "avo/sign_in", to: "avo/sessions#new"
  post "avo/sign_in", to: "avo/sessions#create"
  delete "avo/sign_out", to: "avo/sessions#destroy"

  # GraphQL API
  post "/graphql", to: "graphql#execute"

  get "up" => "rails/health#show", :as => :rails_health_check
end
```

**Key Patterns:**
- Mount ActionCable at `/cable`
- Mount Avo admin at `/avo`
- Single GraphQL endpoint at `/graphql`
- Health check at `/up`

---

## 22. BASE MUTATION HELPER

**File:** `backend/app/graphql/mutations/base_mutation.rb`

```ruby
module Mutations
  class BaseMutation < GraphQL::Schema::Mutation
    argument_class Types::BaseArgument
    field_class Types::BaseField

    def current_user
      context[:current_user]
    end

    def authenticate!
      raise GraphQL::ExecutionError, "Authentication required" unless current_user
    end

    def authorize!(record, action)
      policy_class = "#{record.class}Policy".constantize
      policy = policy_class.new(current_user, record)
      raise Pundit::NotAuthorizedError unless policy.public_send(action)
    end
  end
end
```

**Key Patterns:**
- Provides `current_user` helper
- Provides `authenticate!` helper
- Provides `authorize!(record, action)` helper
- All mutations inherit from this

---

## 23. BASE OBJECT HELPER

**File:** `backend/app/graphql/types/base_object.rb`

```ruby
module Types
  class BaseObject < GraphQL::Schema::Object
    edge_type_class(Types::BaseEdge)
    connection_type_class(Types::BaseConnection)
    field_class Types::BaseField

    def current_user
      context[:current_user]
    end

    def authenticate!
      raise GraphQL::ExecutionError, "Authentication required" unless current_user
    end
  end
end
```

**Key Patterns:**
- Provides `current_user` helper
- Provides `authenticate!` helper
- All types inherit from this

---

## 24. TEST HELPER SETUP

**File:** `backend/test/test_helper.rb` (excerpt)

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
require_relative "support/graphql_test_helper"

module AuthTestHelper
  def auth_headers(user)
    secret = Rails.application.credentials.devise_jwt_secret_key!
    payload = user.jwt_payload.merge(
      "jti" => SecureRandom.uuid,
      "iat" => Time.current.to_i,
      "exp" => 15.minutes.from_now.to_i
    )
    token = JWT.encode(payload, secret, "HS256")
    { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" }
  end
end

module ActiveSupport
  class TestCase
    set_fixture_class rubric_criteria: RubricCriteria
    fixtures :all
    include GraphqlTestHelper

    parallelize(workers: 1)
  end
end
```

**Key Patterns:**
- SimpleCov for code coverage
- JWT token generation for auth tests
- GraphQL test helper included
- All fixtures loaded by default
- Parallel test workers set to 1 (for consistency)

---

## Summary: Key Conventions

| Aspect | Convention |
|--------|-----------|
| **Models** | Include `PublicActivity::Model`, use `enum`, `validates`, `after_commit` |
| **Migrations** | Use `safety_assured`, add indexes, set defaults |
| **GraphQL Mutations** | Inherit `BaseMutation`, authenticate, authorize, return data + errors |
| **GraphQL Types** | Inherit `BaseObject`, define fields with types |
| **GraphQL Input Types** | Inherit `BaseInputObject`, use `argument` |
| **GraphQL Enums** | Inherit `BaseEnum`, map GraphQL names to Ruby values |
| **Pundit Policies** | Inherit `ApplicationPolicy`, implement action methods, define Scope |
| **ActionCable Channels** | Inherit `ApplicationCable::Channel`, use `stream_for`, authorize |
| **Jobs** | Inherit `ApplicationJob`, use `queue_as`, `limits_concurrency` |
| **Tests** | Use fixtures, `execute_query` helper, test success + errors + auth |
| **Fixtures** | YAML format, reference other fixtures, use enum integers |
| **Seeds** | Use `create!`, store references, organize with comments |

---

## File Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── application_record.rb
│   │   ├── daily_score.rb
│   │   ├── notification.rb
│   │   ├── school.rb
│   │   ├── student.rb
│   │   ├── classroom.rb
│   │   └── teacher.rb
│   ├── graphql/
│   │   ├── mutations/
│   │   │   ├── base_mutation.rb
│   │   │   ├── create_daily_score.rb
│   │   │   └── bulk_create_daily_scores.rb
│   │   └── types/
│   │       ├── base_object.rb
│   │       ├── base_input_object.rb
│   │       ├── base_enum.rb
│   │       ├── daily_score_type.rb
│   │       ├── create_daily_score_input_type.rb
│   │       ├── update_daily_score_input_type.rb
│   │       ├── skill_category_enum.rb
│   │       ├── user_error_type.rb
│   │       └── query_type.rb
│   ├── policies/
│   │   ├── application_policy.rb
│   │   └── daily_score_policy.rb
│   ├── channels/
│   │   ├── notifications_channel.rb
│   │   └── chat_channel.rb
│   └── jobs/
│       ├── application_job.rb
│       └── refresh_radar_summary_job.rb
├── config/
│   └── routes.rb
├── db/
│   ├── migrate/
│   │   └── 20260310115453_add_kahoot_exam_access.rb
│   └── seeds.rb
└── test/
    ├── models/
    │   └── daily_score_test.rb
    ├── graphql/
    │   └── mutations/
    │       └── daily_scores_test.rb
    ├── fixtures/
    │   └── daily_scores.yml
    └── test_helper.rb
```

---

**Ready to implement!** Use these patterns as templates for new features.
