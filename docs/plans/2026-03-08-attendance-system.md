# Attendance & Leave Request System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add daily attendance tracking with parent leave request workflow for Indonesian elementary schools.

**Architecture:** Two-table approach — `attendances` (source of truth, one record per student per classroom per day) and `leave_requests` (parent submission workflow). Teacher bulk-marks attendance. Parent submits leave requests that teacher approves/rejects. Approved leaves auto-create attendance records. School manager has read-only dashboard.

**Tech Stack:** Rails 8.1.2, GraphQL (graphql-ruby), Minitest, SvelteKit, Paraglide.js i18n, Tailwind CSS

**Design Doc:** `docs/plans/2026-03-08-attendance-system-design.md`

---

## Phase 1: Backend Models & Migrations

### Task 1: Create Attendance migration and model

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_create_attendances.rb`
- Create: `backend/app/models/attendance.rb`
- Create: `backend/test/fixtures/attendances.yml`
- Create: `backend/test/models/attendance_test.rb`

**Step 1: Generate migration**

Run: `cd backend && bin/rails generate migration CreateAttendances`

Then edit the migration file:

```ruby
class CreateAttendances < ActiveRecord::Migration[8.0]
  def change
    create_table :attendances do |t|
      t.references :student, null: false, foreign_key: true
      t.references :classroom, null: false, foreign_key: true
      t.date :date, null: false
      t.integer :status, null: false, default: 0
      t.string :recorded_by_type
      t.bigint :recorded_by_id
      t.references :leave_request, foreign_key: true
      t.text :notes

      t.timestamps
    end

    add_index :attendances, [ :student_id, :classroom_id, :date ], unique: true, name: "idx_attendances_unique"
    add_index :attendances, [ :classroom_id, :date ]
    add_index :attendances, [ :recorded_by_type, :recorded_by_id ]
  end
end
```

**Step 2: Create model**

```ruby
# backend/app/models/attendance.rb
# frozen_string_literal: true

class Attendance < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :student
  belongs_to :classroom
  belongs_to :recorded_by, polymorphic: true, optional: true
  belongs_to :leave_request, optional: true

  enum :status, { present: 0, sick: 1, excused: 2, unexcused: 3 }

  encrypts :notes

  validates :date, presence: true
  validates :status, presence: true
  validates :student_id, uniqueness: { scope: [ :classroom_id, :date ], message: "already has attendance for this classroom on this date" }

  scope :for_date, ->(date) { where(date: date) }
  scope :for_classroom, ->(classroom_id) { where(classroom_id: classroom_id) }
  scope :absent, -> { where.not(status: :present) }

  after_commit :invalidate_caches, on: [ :create, :update, :destroy ]

  private

  def invalidate_caches
    Rails.cache.delete("classroom_attendance/#{classroom_id}/#{date}")
    Rails.cache.delete("student_attendance/#{student_id}")
  end
end
```

**Step 3: Create fixtures**

```yaml
# backend/test/fixtures/attendances.yml
emma_present_mar1:
  student: student_emma
  classroom: classroom_1a
  date: "2026-03-01"
  status: 0
  recorded_by_type: "Teacher"
  recorded_by_id: 1

emma_sick_mar2:
  student: student_emma
  classroom: classroom_1a
  date: "2026-03-02"
  status: 1
  recorded_by_type: "Teacher"
  recorded_by_id: 1

liam_present_mar1:
  student: student_liam
  classroom: classroom_1a
  date: "2026-03-01"
  status: 0
  recorded_by_type: "Teacher"
  recorded_by_id: 1
```

Note: Fixture student/classroom names must match existing fixtures. Check `backend/test/fixtures/students.yml` and `backend/test/fixtures/classrooms.yml` for exact names.

**Step 4: Write model tests**

```ruby
# backend/test/models/attendance_test.rb
require "test_helper"

class AttendanceTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_emma)
    @teacher = teachers(:teacher_alice)
    @classroom = classrooms(:classroom_1a)
  end

  test "valid attendance record" do
    attendance = Attendance.new(
      student: @student,
      classroom: @classroom,
      date: Date.new(2026, 4, 1),
      status: :present,
      recorded_by: @teacher
    )
    assert attendance.valid?, attendance.errors.full_messages.join(", ")
  end

  test "requires date" do
    attendance = Attendance.new(student: @student, classroom: @classroom, status: :present)
    assert_not attendance.valid?
    assert_includes attendance.errors[:date], "can't be blank"
  end

  test "requires status" do
    attendance = Attendance.new(student: @student, classroom: @classroom, date: Date.today)
    attendance.status = nil
    assert_not attendance.valid?
  end

  test "unique per student per classroom per date" do
    Attendance.create!(student: @student, classroom: @classroom, date: Date.new(2026, 4, 2), status: :present, recorded_by: @teacher)
    duplicate = Attendance.new(student: @student, classroom: @classroom, date: Date.new(2026, 4, 2), status: :sick)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:student_id], "already has attendance for this classroom on this date"
  end

  test "enum statuses" do
    assert_equal({ "present" => 0, "sick" => 1, "excused" => 2, "unexcused" => 3 }, Attendance.statuses)
  end

  test "for_date scope" do
    date = Date.new(2026, 3, 1)
    records = Attendance.for_date(date)
    assert records.all? { |r| r.date == date }
  end

  test "for_classroom scope" do
    records = Attendance.for_classroom(@classroom.id)
    assert records.all? { |r| r.classroom_id == @classroom.id }
  end

  test "absent scope excludes present" do
    records = Attendance.absent
    assert records.none? { |r| r.present? }
  end

  test "encrypts notes" do
    attendance = Attendance.create!(
      student: @student, classroom: @classroom,
      date: Date.new(2026, 4, 3), status: :sick,
      recorded_by: @teacher, notes: "Had a fever"
    )
    assert_equal "Had a fever", attendance.notes
    raw = Attendance.connection.select_value("SELECT notes FROM attendances WHERE id = #{attendance.id}")
    assert_not_equal "Had a fever", raw
  end

  test "belongs to student, classroom, and recorded_by" do
    attendance = attendances(:emma_present_mar1)
    assert_equal @student, attendance.student
    assert_equal @classroom, attendance.classroom
  end

  test "leave_request association is optional" do
    attendance = Attendance.new(
      student: @student, classroom: @classroom,
      date: Date.new(2026, 4, 4), status: :present,
      recorded_by: @teacher
    )
    assert attendance.valid?
    assert_nil attendance.leave_request
  end
end
```

**Step 5: Run migration and tests**

Run: `cd backend && bin/rails db:migrate && bin/rails test test/models/attendance_test.rb`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add Attendance model with migration, validations, and tests"
```

---

### Task 2: Create LeaveRequest migration and model

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_create_leave_requests.rb`
- Create: `backend/app/models/leave_request.rb`
- Create: `backend/test/fixtures/leave_requests.yml`
- Create: `backend/test/models/leave_request_test.rb`

**Step 1: Generate migration**

Run: `cd backend && bin/rails generate migration CreateLeaveRequests`

Edit the migration:

```ruby
class CreateLeaveRequests < ActiveRecord::Migration[8.0]
  def change
    create_table :leave_requests do |t|
      t.references :student, null: false, foreign_key: true
      t.references :parent, null: false, foreign_key: true
      t.integer :request_type, null: false, default: 0
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.text :reason, null: false
      t.integer :status, null: false, default: 0
      t.references :reviewed_by, foreign_key: { to_table: :teachers }
      t.datetime :reviewed_at
      t.text :rejection_reason

      t.timestamps
    end

    add_index :leave_requests, [ :student_id, :status ]
    add_index :leave_requests, [ :parent_id, :status ]
  end
end
```

**Step 2: Create model**

```ruby
# backend/app/models/leave_request.rb
# frozen_string_literal: true

class LeaveRequest < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :student
  belongs_to :parent
  belongs_to :reviewed_by, class_name: "Teacher", optional: true

  has_many :attendances, dependent: :nullify

  enum :request_type, { sick: 0, excused: 1 }
  enum :status, { pending: 0, approved: 1, rejected: 2 }

  encrypts :reason
  encrypts :rejection_reason

  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :reason, presence: true
  validate :end_date_after_start_date
  validate :parent_owns_student

  scope :pending_for_classroom, ->(classroom_id) {
    joins(student: :classroom_students)
      .merge(ClassroomStudent.current)
      .where(classroom_students: { classroom_id: classroom_id })
      .pending
  }

  def date_range
    start_date..end_date
  end

  def days_count
    (end_date - start_date).to_i + 1
  end

  private

  def end_date_after_start_date
    return if start_date.blank? || end_date.blank?
    if end_date < start_date
      errors.add(:end_date, "must be on or after start date")
    end
  end

  def parent_owns_student
    return if parent.blank? || student.blank?
    unless parent.children.exists?(id: student.id)
      errors.add(:student, "does not belong to this parent")
    end
  end
end
```

**Step 3: Create fixtures**

```yaml
# backend/test/fixtures/leave_requests.yml
emma_sick_leave:
  student: student_emma
  parent: parent_carol
  request_type: 0
  start_date: "2026-03-10"
  end_date: "2026-03-11"
  reason: "Flu symptoms"
  status: 0

emma_approved_leave:
  student: student_emma
  parent: parent_carol
  request_type: 1
  start_date: "2026-03-05"
  end_date: "2026-03-05"
  reason: "Family event"
  status: 1
  reviewed_by: teacher_alice
  reviewed_at: "2026-03-04 10:00:00"
```

Note: Verify parent/student fixture names match. `parent_carol` must be a parent of `student_emma` in `parent_students.yml`.

**Step 4: Write model tests**

```ruby
# backend/test/models/leave_request_test.rb
require "test_helper"

class LeaveRequestTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_emma)
    @parent = parents(:parent_carol)
    @teacher = teachers(:teacher_alice)
  end

  test "valid leave request" do
    lr = LeaveRequest.new(
      student: @student, parent: @parent,
      request_type: :sick,
      start_date: Date.new(2026, 4, 1),
      end_date: Date.new(2026, 4, 2),
      reason: "Flu symptoms"
    )
    assert lr.valid?, lr.errors.full_messages.join(", ")
  end

  test "requires start_date" do
    lr = LeaveRequest.new(student: @student, parent: @parent, request_type: :sick, end_date: Date.today, reason: "Sick")
    assert_not lr.valid?
    assert_includes lr.errors[:start_date], "can't be blank"
  end

  test "requires end_date" do
    lr = LeaveRequest.new(student: @student, parent: @parent, request_type: :sick, start_date: Date.today, reason: "Sick")
    assert_not lr.valid?
    assert_includes lr.errors[:end_date], "can't be blank"
  end

  test "requires reason" do
    lr = LeaveRequest.new(student: @student, parent: @parent, request_type: :sick, start_date: Date.today, end_date: Date.today)
    assert_not lr.valid?
    assert_includes lr.errors[:reason], "can't be blank"
  end

  test "end_date must be on or after start_date" do
    lr = LeaveRequest.new(
      student: @student, parent: @parent, request_type: :sick,
      start_date: Date.new(2026, 4, 5), end_date: Date.new(2026, 4, 3),
      reason: "Sick"
    )
    assert_not lr.valid?
    assert_includes lr.errors[:end_date], "must be on or after start date"
  end

  test "single day leave is valid (start == end)" do
    lr = LeaveRequest.new(
      student: @student, parent: @parent, request_type: :excused,
      start_date: Date.new(2026, 4, 1), end_date: Date.new(2026, 4, 1),
      reason: "Family event"
    )
    assert lr.valid?
  end

  test "parent must own student" do
    other_student = students(:student_liam)
    # Ensure parent_carol does NOT own student_liam — check fixtures
    lr = LeaveRequest.new(
      student: other_student, parent: @parent, request_type: :sick,
      start_date: Date.today, end_date: Date.today, reason: "Sick"
    )
    # This test depends on fixture relationships — skip if parent owns both students
    unless @parent.children.exists?(id: other_student.id)
      assert_not lr.valid?
      assert_includes lr.errors[:student], "does not belong to this parent"
    end
  end

  test "enum request_types" do
    assert_equal({ "sick" => 0, "excused" => 1 }, LeaveRequest.request_types)
  end

  test "enum statuses" do
    assert_equal({ "pending" => 0, "approved" => 1, "rejected" => 2 }, LeaveRequest.statuses)
  end

  test "defaults to pending status" do
    lr = LeaveRequest.create!(
      student: @student, parent: @parent, request_type: :sick,
      start_date: Date.new(2026, 4, 10), end_date: Date.new(2026, 4, 10),
      reason: "Headache"
    )
    assert lr.pending?
  end

  test "days_count calculation" do
    lr = LeaveRequest.new(start_date: Date.new(2026, 4, 1), end_date: Date.new(2026, 4, 3))
    assert_equal 3, lr.days_count
  end

  test "date_range returns range" do
    lr = LeaveRequest.new(start_date: Date.new(2026, 4, 1), end_date: Date.new(2026, 4, 3))
    assert_equal Date.new(2026, 4, 1)..Date.new(2026, 4, 3), lr.date_range
  end

  test "encrypts reason" do
    lr = LeaveRequest.create!(
      student: @student, parent: @parent, request_type: :sick,
      start_date: Date.new(2026, 4, 10), end_date: Date.new(2026, 4, 10),
      reason: "Doctor visit"
    )
    raw = LeaveRequest.connection.select_value("SELECT reason FROM leave_requests WHERE id = #{lr.id}")
    assert_not_equal "Doctor visit", raw
  end

  test "has_many attendances" do
    lr = leave_requests(:emma_approved_leave)
    assert_respond_to lr, :attendances
  end
end
```

**Step 5: Run migration and tests**

Run: `cd backend && bin/rails db:migrate && bin/rails test test/models/leave_request_test.rb`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add LeaveRequest model with migration, validations, and tests"
```

---

### Task 3: Add associations to existing models

**Files:**
- Modify: `backend/app/models/student.rb`
- Modify: `backend/app/models/classroom.rb`
- Modify: `backend/app/models/teacher.rb`
- Modify: `backend/app/models/parent.rb`

**Step 1: Add associations**

In `student.rb`, add:
```ruby
has_many :attendances, dependent: :destroy
has_many :leave_requests, dependent: :destroy
```

In `classroom.rb`, add:
```ruby
has_many :attendances, dependent: :destroy
```

In `teacher.rb`, add:
```ruby
has_many :reviewed_leave_requests, class_name: "LeaveRequest", foreign_key: :reviewed_by_id, dependent: :nullify
```

In `parent.rb`, add:
```ruby
has_many :leave_requests, dependent: :destroy
```

**Step 2: Run full test suite to verify no regressions**

Run: `cd backend && bin/rails test`
Expected: All existing tests still pass.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add attendance/leave_request associations to Student, Classroom, Teacher, Parent"
```

---

## Phase 2: Pundit Policies

### Task 4: Create AttendancePolicy and LeaveRequestPolicy

**Files:**
- Create: `backend/app/policies/attendance_policy.rb`
- Create: `backend/app/policies/leave_request_policy.rb`

**Step 1: Create AttendancePolicy**

```ruby
# backend/app/policies/attendance_policy.rb
class AttendancePolicy < ApplicationPolicy
  def create?
    user.teacher? && permitted?(:create)
  end

  def update?
    user.teacher? && permitted?(:update) && teaches_classroom?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.joins(:classroom).where(classrooms: { school_id: user.school_id })
      elsif user.teacher?
        scope.joins(:classroom).where(
          classroom_id: user.classroom_teachers.pluck(:classroom_id)
        )
      elsif user.parent?
        scope.joins(student: :parent_students).where(parent_students: { parent_id: user.id })
      else
        scope.none
      end
    end
  end

  private

  def teaches_classroom?
    user.classroom_teachers.exists?(classroom_id: record.classroom_id)
  end
end
```

**Step 2: Create LeaveRequestPolicy**

```ruby
# backend/app/policies/leave_request_policy.rb
class LeaveRequestPolicy < ApplicationPolicy
  def create?
    user.parent?
  end

  def delete?
    user.parent? && record.parent_id == user.id && record.pending?
  end

  def review?
    user.teacher? && teaches_student_classroom?
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
        scope.joins(student: :classroom_students)
          .merge(ClassroomStudent.current)
          .where(classroom_students: {
            classroom_id: user.classroom_teachers.pluck(:classroom_id)
          })
      elsif user.parent?
        scope.where(parent_id: user.id)
      else
        scope.none
      end
    end
  end

  private

  def teaches_student_classroom?
    record.student.classroom_students.current.exists?(
      classroom_id: user.classroom_teachers.pluck(:classroom_id)
    )
  end
end
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Pundit policies for Attendance and LeaveRequest"
```

---

## Phase 3: GraphQL Types & Mutations

### Task 5: Create GraphQL types

**Files:**
- Create: `backend/app/graphql/types/attendance_type.rb`
- Create: `backend/app/graphql/types/attendance_status_enum.rb`
- Create: `backend/app/graphql/types/leave_request_type.rb`
- Create: `backend/app/graphql/types/leave_request_type_enum.rb`
- Create: `backend/app/graphql/types/leave_request_status_enum.rb`
- Create: `backend/app/graphql/types/attendance_record_input_type.rb`

**Step 1: Create enum types**

```ruby
# backend/app/graphql/types/attendance_status_enum.rb
module Types
  class AttendanceStatusEnum < Types::BaseEnum
    value "PRESENT", value: "present"
    value "SICK", value: "sick"
    value "EXCUSED", value: "excused"
    value "UNEXCUSED", value: "unexcused"
  end
end
```

```ruby
# backend/app/graphql/types/leave_request_type_enum.rb
module Types
  class LeaveRequestTypeEnum < Types::BaseEnum
    value "SICK", value: "sick"
    value "EXCUSED", value: "excused"
  end
end
```

```ruby
# backend/app/graphql/types/leave_request_status_enum.rb
module Types
  class LeaveRequestStatusEnum < Types::BaseEnum
    value "PENDING", value: "pending"
    value "APPROVED", value: "approved"
    value "REJECTED", value: "rejected"
  end
end
```

**Step 2: Create object types**

```ruby
# backend/app/graphql/types/attendance_type.rb
module Types
  class AttendanceType < Types::BaseObject
    field :id, ID, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :status, AttendanceStatusEnum, null: false
    field :notes, String
    field :student, Types::StudentType, null: false
    field :classroom, Types::ClassroomType, null: false
    field :leave_request, Types::LeaveRequestType
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

```ruby
# backend/app/graphql/types/leave_request_type.rb
module Types
  class LeaveRequestType < Types::BaseObject
    field :id, ID, null: false
    field :request_type, LeaveRequestTypeEnum, null: false
    field :start_date, GraphQL::Types::ISO8601Date, null: false
    field :end_date, GraphQL::Types::ISO8601Date, null: false
    field :reason, String, null: false
    field :status, LeaveRequestStatusEnum, null: false
    field :rejection_reason, String
    field :reviewed_at, GraphQL::Types::ISO8601DateTime
    field :student, Types::StudentType, null: false
    field :parent, Types::ParentType, null: false
    field :reviewed_by, Types::TeacherType
    field :days_count, Integer, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

**Step 3: Create input type**

```ruby
# backend/app/graphql/types/attendance_record_input_type.rb
module Types
  class AttendanceRecordInputType < Types::BaseInputObject
    argument :student_id, ID, required: true
    argument :status, Types::AttendanceStatusEnum, required: true
    argument :notes, String, required: false
  end
end
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add GraphQL types for Attendance and LeaveRequest"
```

---

### Task 6: Create GraphQL mutations

**Files:**
- Create: `backend/app/graphql/mutations/bulk_record_attendance.rb`
- Create: `backend/app/graphql/mutations/update_attendance.rb`
- Create: `backend/app/graphql/mutations/create_leave_request.rb`
- Create: `backend/app/graphql/mutations/delete_leave_request.rb`
- Create: `backend/app/graphql/mutations/review_leave_request.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`

**Step 1: Create bulkRecordAttendance**

```ruby
# backend/app/graphql/mutations/bulk_record_attendance.rb
# frozen_string_literal: true

module Mutations
  class BulkRecordAttendance < BaseMutation
    argument :classroom_id, ID, required: true
    argument :date, GraphQL::Types::ISO8601Date, required: true
    argument :records, [ Types::AttendanceRecordInputType ], required: true

    field :attendances, [ Types::AttendanceType ], null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(classroom_id:, date:, records:)
      authenticate!

      classroom = Classroom.find(classroom_id)
      raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).show?

      created = []
      all_errors = []

      records.each do |record_input|
        student = Student.find(record_input.student_id)
        raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?

        attendance = Attendance.find_or_initialize_by(
          student_id: record_input.student_id,
          classroom_id: classroom_id,
          date: date
        )
        attendance.status = record_input.status
        attendance.notes = record_input.notes
        attendance.recorded_by = current_user

        raise Pundit::NotAuthorizedError unless AttendancePolicy.new(current_user, attendance).create?

        if attendance.save
          created << attendance
        else
          attendance.errors.each do |e|
            all_errors << { message: "#{student.name}: #{e.full_message}", path: [ record_input.student_id ] }
          end
        end
      end

      AuditLogger.log(
        event_type: :ATTENDANCE_BULK_RECORD,
        action: "bulk_record_attendance",
        user: current_user,
        resource: classroom,
        request: context[:request]
      )

      { attendances: created, errors: all_errors }
    end
  end
end
```

**Step 2: Create updateAttendance**

```ruby
# backend/app/graphql/mutations/update_attendance.rb
# frozen_string_literal: true

module Mutations
  class UpdateAttendance < BaseMutation
    argument :attendance_id, ID, required: true
    argument :status, Types::AttendanceStatusEnum, required: true
    argument :notes, String, required: false

    field :attendance, Types::AttendanceType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(attendance_id:, status:, notes: nil)
      authenticate!

      attendance = Attendance.find(attendance_id)
      raise Pundit::NotAuthorizedError unless AttendancePolicy.new(current_user, attendance).update?

      attendance.status = status
      attendance.notes = notes unless notes.nil?
      attendance.recorded_by = current_user

      if attendance.save
        AuditLogger.log(
          event_type: :ATTENDANCE_UPDATE,
          action: "update_attendance",
          user: current_user,
          resource: attendance,
          request: context[:request]
        )
        { attendance: attendance, errors: [] }
      else
        {
          attendance: nil,
          errors: attendance.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
```

**Step 3: Create createLeaveRequest**

```ruby
# backend/app/graphql/mutations/create_leave_request.rb
# frozen_string_literal: true

module Mutations
  class CreateLeaveRequest < BaseMutation
    argument :student_id, ID, required: true
    argument :request_type, Types::LeaveRequestTypeEnum, required: true
    argument :start_date, GraphQL::Types::ISO8601Date, required: true
    argument :end_date, GraphQL::Types::ISO8601Date, required: true
    argument :reason, String, required: true

    field :leave_request, Types::LeaveRequestType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(student_id:, request_type:, start_date:, end_date:, reason:)
      authenticate!

      leave_request = LeaveRequest.new(
        student_id: student_id,
        parent: current_user,
        request_type: request_type,
        start_date: start_date,
        end_date: end_date,
        reason: reason
      )

      raise Pundit::NotAuthorizedError unless LeaveRequestPolicy.new(current_user, leave_request).create?

      if leave_request.save
        AuditLogger.log(
          event_type: :LEAVE_REQUEST_CREATE,
          action: "create_leave_request",
          user: current_user,
          resource: leave_request,
          request: context[:request]
        )

        # Notify classroom teachers
        leave_request.student.classroom_students.current.each do |cs|
          cs.classroom.teachers.each do |teacher|
            Notification.create!(
              recipient: teacher,
              notifiable: leave_request,
              title: "New Leave Request",
              body: "#{current_user.name} submitted a #{request_type} leave for #{leave_request.student.name} (#{start_date} - #{end_date})"
            )
          end
        end

        { leave_request: leave_request, errors: [] }
      else
        {
          leave_request: nil,
          errors: leave_request.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
```

**Step 4: Create deleteLeaveRequest**

```ruby
# backend/app/graphql/mutations/delete_leave_request.rb
# frozen_string_literal: true

module Mutations
  class DeleteLeaveRequest < BaseMutation
    argument :leave_request_id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(leave_request_id:)
      authenticate!

      leave_request = LeaveRequest.find(leave_request_id)
      raise Pundit::NotAuthorizedError unless LeaveRequestPolicy.new(current_user, leave_request).delete?

      leave_request.destroy!

      AuditLogger.log(
        event_type: :LEAVE_REQUEST_DELETE,
        action: "delete_leave_request",
        user: current_user,
        resource: leave_request,
        request: context[:request]
      )

      { success: true, errors: [] }
    rescue ActiveRecord::RecordNotDestroyed => e
      { success: false, errors: [ { message: e.message, path: [ "leaveRequestId" ] } ] }
    end
  end
end
```

**Step 5: Create reviewLeaveRequest**

```ruby
# backend/app/graphql/mutations/review_leave_request.rb
# frozen_string_literal: true

module Mutations
  class ReviewLeaveRequest < BaseMutation
    argument :leave_request_id, ID, required: true
    argument :decision, Types::LeaveRequestStatusEnum, required: true
    argument :rejection_reason, String, required: false

    field :leave_request, Types::LeaveRequestType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(leave_request_id:, decision:, rejection_reason: nil)
      authenticate!

      leave_request = LeaveRequest.find(leave_request_id)
      raise Pundit::NotAuthorizedError unless LeaveRequestPolicy.new(current_user, leave_request).review?

      unless leave_request.pending?
        return {
          leave_request: nil,
          errors: [ { message: "Leave request has already been reviewed", path: [ "leaveRequestId" ] } ]
        }
      end

      leave_request.status = decision
      leave_request.reviewed_by = current_user
      leave_request.reviewed_at = Time.current
      leave_request.rejection_reason = rejection_reason if decision == "rejected"

      if leave_request.save
        # If approved, create attendance records for each day in range
        if leave_request.approved?
          attendance_status = leave_request.sick? ? :sick : :excused
          classroom_ids = leave_request.student.classroom_students.current.pluck(:classroom_id)

          leave_request.date_range.each do |date|
            classroom_ids.each do |classroom_id|
              Attendance.find_or_initialize_by(
                student_id: leave_request.student_id,
                classroom_id: classroom_id,
                date: date
              ).update!(
                status: attendance_status,
                recorded_by: current_user,
                leave_request: leave_request,
                notes: "Auto-created from leave request ##{leave_request.id}"
              )
            end
          end
        end

        # Notify parent
        Notification.create!(
          recipient: leave_request.parent,
          notifiable: leave_request,
          title: "Leave Request #{decision.capitalize}",
          body: "Your #{leave_request.request_type} leave request for #{leave_request.student.name} (#{leave_request.start_date} - #{leave_request.end_date}) has been #{decision}."
        )

        AuditLogger.log(
          event_type: :LEAVE_REQUEST_REVIEW,
          action: "review_leave_request",
          user: current_user,
          resource: leave_request,
          request: context[:request]
        )

        { leave_request: leave_request, errors: [] }
      else
        {
          leave_request: nil,
          errors: leave_request.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
```

**Step 6: Register mutations in MutationType**

Add to `backend/app/graphql/types/mutation_type.rb` before the closing `end`:

```ruby
    # Attendance
    field :bulk_record_attendance, mutation: Mutations::BulkRecordAttendance
    field :update_attendance, mutation: Mutations::UpdateAttendance

    # Leave Requests
    field :create_leave_request, mutation: Mutations::CreateLeaveRequest
    field :delete_leave_request, mutation: Mutations::DeleteLeaveRequest
    field :review_leave_request, mutation: Mutations::ReviewLeaveRequest
```

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: add GraphQL mutations for attendance and leave requests"
```

---

### Task 7: Create GraphQL queries

**Files:**
- Modify: `backend/app/graphql/types/query_type.rb`

**Step 1: Add attendance queries to QueryType**

Add these fields and resolvers to `backend/app/graphql/types/query_type.rb`:

```ruby
    # ── Attendance ──────────────────────────────────────────────────────────────

    field :classroom_attendance, [ Types::AttendanceType ], null: false,
      description: "All attendance records for a classroom on a given date" do
      argument :classroom_id, ID, required: true
      argument :date, GraphQL::Types::ISO8601Date, required: true
    end

    def classroom_attendance(classroom_id:, date:)
      authenticate!
      classroom = Classroom.find(classroom_id)

      if current_user.teacher?
        raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).show?
      elsif current_user.school_manager?
        raise Pundit::NotAuthorizedError unless classroom.school_id == current_user.school_id
      else
        raise GraphQL::ExecutionError, "Not authorized"
      end

      AuditLogger.log(event_type: :ATTENDANCE_VIEW, action: "classroom_attendance", user: current_user, resource: classroom, request: context[:request])

      Attendance.where(classroom_id: classroom_id, date: date).includes(:student).order("students.name")
    end

    field :student_attendance, [ Types::AttendanceType ], null: false,
      description: "Attendance history for a student" do
      argument :student_id, ID, required: true
      argument :start_date, GraphQL::Types::ISO8601Date, required: false
      argument :end_date, GraphQL::Types::ISO8601Date, required: false
    end

    def student_attendance(student_id:, start_date: nil, end_date: nil)
      authenticate!
      student = Student.find(student_id)

      if current_user.teacher?
        raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?
      elsif current_user.parent?
        unless current_user.children.exists?(id: student.id)
          raise GraphQL::ExecutionError, "Not authorized"
        end
        unless Consent.active.exists?(student: student, parent: current_user)
          raise GraphQL::ExecutionError, "Active consent required to view attendance data"
        end
      elsif current_user.school_manager?
        raise Pundit::NotAuthorizedError unless student.classroom_students.current.joins(:classroom).exists?(classrooms: { school_id: current_user.school_id })
      else
        raise GraphQL::ExecutionError, "Not authorized"
      end

      AuditLogger.log(event_type: :ATTENDANCE_VIEW, action: "student_attendance", user: current_user, resource: student, request: context[:request])

      scope = student.attendances.order(date: :desc)
      scope = scope.where("date >= ?", start_date) if start_date
      scope = scope.where("date <= ?", end_date) if end_date
      scope
    end

    field :classroom_attendance_summary, GraphQL::Types::JSON, null: false,
      description: "Attendance summary stats per student for a classroom and date range" do
      argument :classroom_id, ID, required: true
      argument :start_date, GraphQL::Types::ISO8601Date, required: true
      argument :end_date, GraphQL::Types::ISO8601Date, required: true
    end

    def classroom_attendance_summary(classroom_id:, start_date:, end_date:)
      authenticate!
      classroom = Classroom.find(classroom_id)

      if current_user.teacher?
        raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).show?
      elsif current_user.school_manager?
        raise Pundit::NotAuthorizedError unless classroom.school_id == current_user.school_id
      else
        raise GraphQL::ExecutionError, "Not authorized"
      end

      students = classroom.students.order(:name)
      records = Attendance.where(classroom_id: classroom_id, date: start_date..end_date)

      students.map do |student|
        student_records = records.select { |r| r.student_id == student.id }
        {
          studentId: student.id.to_s,
          studentName: student.name,
          totalDays: student_records.size,
          presentCount: student_records.count { |r| r.present? },
          sickCount: student_records.count { |r| r.sick? },
          excusedCount: student_records.count { |r| r.excused? },
          unexcusedCount: student_records.count { |r| r.unexcused? },
          attendanceRate: student_records.any? ? (student_records.count { |r| r.present? }.to_f / student_records.size * 100).round(1) : nil
        }
      end
    end

    # ── Leave Requests ──────────────────────────────────────────────────────────

    field :leave_requests, [ Types::LeaveRequestType ], null: false,
      description: "Leave requests for teacher's classrooms" do
      argument :classroom_id, ID, required: false
      argument :status, Types::LeaveRequestStatusEnum, required: false
    end

    def leave_requests(classroom_id: nil, status: nil)
      authenticate!

      unless current_user.teacher?
        raise GraphQL::ExecutionError, "Only teachers can view leave requests"
      end

      scope = LeaveRequestPolicy::Scope.new(current_user, LeaveRequest).resolve
      scope = scope.pending_for_classroom(classroom_id) if classroom_id
      scope = scope.where(status: status) if status
      scope.order(created_at: :desc)
    end

    field :parent_leave_requests, [ Types::LeaveRequestType ], null: false,
      description: "Parent's own submitted leave requests" do
      argument :student_id, ID, required: false
      argument :status, Types::LeaveRequestStatusEnum, required: false
    end

    def parent_leave_requests(student_id: nil, status: nil)
      authenticate!

      unless current_user.parent?
        raise GraphQL::ExecutionError, "Only parents can view their leave requests"
      end

      scope = current_user.leave_requests.order(created_at: :desc)
      scope = scope.where(student_id: student_id) if student_id
      scope = scope.where(status: status) if status
      scope
    end
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add GraphQL queries for attendance and leave requests"
```

---

### Task 8: Write GraphQL mutation and query tests

**Files:**
- Create: `backend/test/graphql/mutations/attendance_mutations_test.rb`
- Create: `backend/test/graphql/queries/attendance_query_test.rb`

**Step 1: Write mutation tests**

```ruby
# backend/test/graphql/mutations/attendance_mutations_test.rb
require "test_helper"

class AttendanceMutationsTest < ActiveSupport::TestCase
  BULK_RECORD = <<~GQL
    mutation BulkRecordAttendance($classroomId: ID!, $date: ISO8601Date!, $records: [AttendanceRecordInput!]!) {
      bulkRecordAttendance(classroomId: $classroomId, date: $date, records: $records) {
        attendances { id date status student { id name } }
        errors { message path }
      }
    }
  GQL

  UPDATE_ATTENDANCE = <<~GQL
    mutation UpdateAttendance($attendanceId: ID!, $status: AttendanceStatus!, $notes: String) {
      updateAttendance(attendanceId: $attendanceId, status: $status, notes: $notes) {
        attendance { id status notes }
        errors { message path }
      }
    }
  GQL

  CREATE_LEAVE = <<~GQL
    mutation CreateLeaveRequest($studentId: ID!, $requestType: LeaveRequestType!, $startDate: ISO8601Date!, $endDate: ISO8601Date!, $reason: String!) {
      createLeaveRequest(studentId: $studentId, requestType: $requestType, startDate: $startDate, endDate: $endDate, reason: $reason) {
        leaveRequest { id requestType startDate endDate reason status daysCount }
        errors { message path }
      }
    }
  GQL

  DELETE_LEAVE = <<~GQL
    mutation DeleteLeaveRequest($leaveRequestId: ID!) {
      deleteLeaveRequest(leaveRequestId: $leaveRequestId) {
        success
        errors { message path }
      }
    }
  GQL

  REVIEW_LEAVE = <<~GQL
    mutation ReviewLeaveRequest($leaveRequestId: ID!, $decision: LeaveRequestStatus!, $rejectionReason: String) {
      reviewLeaveRequest(leaveRequestId: $leaveRequestId, decision: $decision, rejectionReason: $rejectionReason) {
        leaveRequest { id status reviewedAt rejectionReason }
        errors { message path }
      }
    }
  GQL

  setup do
    @teacher = teachers(:teacher_alice)
    @parent = parents(:parent_carol)
    @student = students(:student_emma)
    @classroom = classrooms(:classroom_1a)
  end

  # ── Bulk Record Attendance ──

  test "teacher bulk records attendance" do
    result = GrewmeSchema.execute(BULK_RECORD, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-04-01",
      "records" => [
        { "studentId" => @student.id.to_s, "status" => "PRESENT" }
      ]
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "bulkRecordAttendance")
    assert_empty data["errors"]
    assert_equal 1, data["attendances"].length
    assert_equal "present", data["attendances"].first["status"]
  end

  test "bulk record updates existing attendance" do
    Attendance.create!(student: @student, classroom: @classroom, date: "2026-04-02", status: :present, recorded_by: @teacher)

    result = GrewmeSchema.execute(BULK_RECORD, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-04-02",
      "records" => [
        { "studentId" => @student.id.to_s, "status" => "SICK", "notes" => "Sent home early" }
      ]
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "bulkRecordAttendance")
    assert_empty data["errors"]
    assert_equal "sick", data["attendances"].first["status"]
  end

  test "parent cannot bulk record attendance" do
    result = GrewmeSchema.execute(BULK_RECORD, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-04-01",
      "records" => [ { "studentId" => @student.id.to_s, "status" => "PRESENT" } ]
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].present?
  end

  test "unauthenticated cannot bulk record" do
    result = GrewmeSchema.execute(BULK_RECORD, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-04-01",
      "records" => [ { "studentId" => @student.id.to_s, "status" => "PRESENT" } ]
    }, context: { current_user: nil, request: ActionDispatch::TestRequest.create })

    assert result["errors"].any? { |e| e["message"].include?("Authentication") }
  end

  # ── Update Attendance ──

  test "teacher updates attendance" do
    attendance = Attendance.create!(student: @student, classroom: @classroom, date: "2026-04-03", status: :present, recorded_by: @teacher)

    result = GrewmeSchema.execute(UPDATE_ATTENDANCE, variables: {
      "attendanceId" => attendance.id.to_s,
      "status" => "EXCUSED",
      "notes" => "Parent called in"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "updateAttendance")
    assert_empty data["errors"]
    assert_equal "excused", data["attendance"]["status"]
    assert_equal "Parent called in", data["attendance"]["notes"]
  end

  # ── Create Leave Request ──

  test "parent creates leave request" do
    result = GrewmeSchema.execute(CREATE_LEAVE, variables: {
      "studentId" => @student.id.to_s,
      "requestType" => "SICK",
      "startDate" => "2026-04-10",
      "endDate" => "2026-04-11",
      "reason" => "Doctor appointment"
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "createLeaveRequest")
    assert_empty data["errors"]
    assert_equal "pending", data["leaveRequest"]["status"]
    assert_equal 2, data["leaveRequest"]["daysCount"]
  end

  test "teacher cannot create leave request" do
    result = GrewmeSchema.execute(CREATE_LEAVE, variables: {
      "studentId" => @student.id.to_s,
      "requestType" => "SICK",
      "startDate" => "2026-04-10",
      "endDate" => "2026-04-10",
      "reason" => "Sick"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    assert result["errors"].present?
  end

  # ── Delete Leave Request ──

  test "parent deletes pending leave request" do
    lr = LeaveRequest.create!(student: @student, parent: @parent, request_type: :sick, start_date: "2026-04-15", end_date: "2026-04-15", reason: "Headache")

    result = GrewmeSchema.execute(DELETE_LEAVE, variables: {
      "leaveRequestId" => lr.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "deleteLeaveRequest")
    assert data["success"]
    assert_raises(ActiveRecord::RecordNotFound) { lr.reload }
  end

  test "parent cannot delete approved leave request" do
    lr = LeaveRequest.create!(student: @student, parent: @parent, request_type: :sick, start_date: "2026-04-16", end_date: "2026-04-16", reason: "Flu", status: :approved, reviewed_by: @teacher, reviewed_at: Time.current)

    result = GrewmeSchema.execute(DELETE_LEAVE, variables: {
      "leaveRequestId" => lr.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].present?
  end

  # ── Review Leave Request ──

  test "teacher approves leave request and creates attendance records" do
    lr = LeaveRequest.create!(student: @student, parent: @parent, request_type: :sick, start_date: "2026-04-20", end_date: "2026-04-21", reason: "Flu")

    result = GrewmeSchema.execute(REVIEW_LEAVE, variables: {
      "leaveRequestId" => lr.id.to_s,
      "decision" => "APPROVED"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "reviewLeaveRequest")
    assert_empty data["errors"]
    assert_equal "approved", data["leaveRequest"]["status"]
    assert_not_nil data["leaveRequest"]["reviewedAt"]

    # Verify attendance records were created
    attendances = Attendance.where(leave_request_id: lr.id)
    assert attendances.any?
    assert attendances.all? { |a| a.sick? }
  end

  test "teacher rejects leave request" do
    lr = LeaveRequest.create!(student: @student, parent: @parent, request_type: :excused, start_date: "2026-04-22", end_date: "2026-04-22", reason: "Shopping")

    result = GrewmeSchema.execute(REVIEW_LEAVE, variables: {
      "leaveRequestId" => lr.id.to_s,
      "decision" => "REJECTED",
      "rejectionReason" => "Not a valid reason"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "reviewLeaveRequest")
    assert_empty data["errors"]
    assert_equal "rejected", data["leaveRequest"]["status"]

    # No attendance records created
    assert_equal 0, Attendance.where(leave_request_id: lr.id).count
  end

  test "cannot review already reviewed request" do
    lr = LeaveRequest.create!(student: @student, parent: @parent, request_type: :sick, start_date: "2026-04-23", end_date: "2026-04-23", reason: "Flu", status: :approved, reviewed_by: @teacher, reviewed_at: Time.current)

    result = GrewmeSchema.execute(REVIEW_LEAVE, variables: {
      "leaveRequestId" => lr.id.to_s,
      "decision" => "REJECTED"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "reviewLeaveRequest")
    assert data["errors"].any? { |e| e["message"].include?("already been reviewed") }
  end
end
```

**Step 2: Write query tests**

```ruby
# backend/test/graphql/queries/attendance_query_test.rb
require "test_helper"

class AttendanceQueryTest < ActiveSupport::TestCase
  CLASSROOM_ATTENDANCE = <<~GQL
    query ClassroomAttendance($classroomId: ID!, $date: ISO8601Date!) {
      classroomAttendance(classroomId: $classroomId, date: $date) {
        id date status student { id name }
      }
    }
  GQL

  STUDENT_ATTENDANCE = <<~GQL
    query StudentAttendance($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
      studentAttendance(studentId: $studentId, startDate: $startDate, endDate: $endDate) {
        id date status
      }
    }
  GQL

  SUMMARY = <<~GQL
    query ClassroomAttendanceSummary($classroomId: ID!, $startDate: ISO8601Date!, $endDate: ISO8601Date!) {
      classroomAttendanceSummary(classroomId: $classroomId, startDate: $startDate, endDate: $endDate)
    }
  GQL

  LEAVE_REQUESTS = <<~GQL
    query LeaveRequests($classroomId: ID, $status: LeaveRequestStatus) {
      leaveRequests(classroomId: $classroomId, status: $status) {
        id requestType startDate endDate reason status student { id name }
      }
    }
  GQL

  PARENT_LEAVE_REQUESTS = <<~GQL
    query ParentLeaveRequests($studentId: ID, $status: LeaveRequestStatus) {
      parentLeaveRequests(studentId: $studentId, status: $status) {
        id requestType startDate endDate status
      }
    }
  GQL

  setup do
    @teacher = teachers(:teacher_alice)
    @parent = parents(:parent_carol)
    @student = students(:student_emma)
    @classroom = classrooms(:classroom_1a)
  end

  test "teacher views classroom attendance" do
    result = GrewmeSchema.execute(CLASSROOM_ATTENDANCE, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-03-01"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "classroomAttendance")
    assert_not_nil data
  end

  test "parent cannot view classroom attendance" do
    result = GrewmeSchema.execute(CLASSROOM_ATTENDANCE, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-03-01"
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].present?
  end

  test "teacher views student attendance" do
    result = GrewmeSchema.execute(STUDENT_ATTENDANCE, variables: {
      "studentId" => @student.id.to_s
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "studentAttendance")
    assert_not_nil data
  end

  test "parent with consent views student attendance" do
    Consent.create!(student: @student, parent: @parent, parent_email: @parent.email, consent_method: "email_plus", status: :granted, granted_at: Time.current)

    result = GrewmeSchema.execute(STUDENT_ATTENDANCE, variables: {
      "studentId" => @student.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "studentAttendance")
    assert_not_nil data
  end

  test "parent without consent denied student attendance" do
    result = GrewmeSchema.execute(STUDENT_ATTENDANCE, variables: {
      "studentId" => @student.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].any? { |e| e["message"].include?("consent") || e["message"].include?("authorized") }
  end

  test "date range filtering on student attendance" do
    Attendance.create!(student: @student, classroom: @classroom, date: "2026-03-01", status: :present, recorded_by: @teacher)
    Attendance.create!(student: @student, classroom: @classroom, date: "2026-04-01", status: :present, recorded_by: @teacher)

    result = GrewmeSchema.execute(STUDENT_ATTENDANCE, variables: {
      "studentId" => @student.id.to_s,
      "startDate" => "2026-03-01",
      "endDate" => "2026-03-31"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "studentAttendance")
    assert data.all? { |a| a["date"] >= "2026-03-01" && a["date"] <= "2026-03-31" }
  end

  test "classroom attendance summary" do
    result = GrewmeSchema.execute(SUMMARY, variables: {
      "classroomId" => @classroom.id.to_s,
      "startDate" => "2026-03-01",
      "endDate" => "2026-03-31"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "classroomAttendanceSummary")
    assert_not_nil data
    assert data.is_a?(Array)
  end

  test "teacher views leave requests" do
    result = GrewmeSchema.execute(LEAVE_REQUESTS, variables: {},
      context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "leaveRequests")
    assert_not_nil data
  end

  test "parent views own leave requests" do
    LeaveRequest.create!(student: @student, parent: @parent, request_type: :sick, start_date: "2026-04-10", end_date: "2026-04-10", reason: "Sick")

    result = GrewmeSchema.execute(PARENT_LEAVE_REQUESTS, variables: {},
      context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "parentLeaveRequests")
    assert_not_nil data
    assert data.length >= 1
  end
end
```

**Step 3: Run all tests**

Run: `cd backend && bin/rails test`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add -A && git commit -m "test: add GraphQL mutation and query tests for attendance and leave requests"
```

---

## Phase 4: Frontend — i18n Keys

### Task 9: Add i18n translation keys

**Files:**
- Modify: `front-end/messages/en.json`
- Modify: `front-end/messages/id.json`

**Step 1: Add attendance keys to en.json**

Add before the closing `}`:

```json
  "attendance_title": "Attendance",
  "attendance_date_label": "Date",
  "attendance_classroom_label": "Classroom",
  "attendance_mark_all": "Mark All Present",
  "attendance_save": "Save Attendance",
  "attendance_saving": "Saving...",
  "attendance_saved": "Attendance saved successfully",
  "attendance_status_present": "Present",
  "attendance_status_sick": "Sick",
  "attendance_status_excused": "Excused",
  "attendance_status_unexcused": "Unexcused",
  "attendance_status_not_marked": "Not Marked",
  "attendance_no_students": "No students in this classroom",
  "attendance_summary_title": "Attendance Summary",
  "attendance_summary_rate": "Attendance Rate",
  "attendance_summary_total_days": "Total Days",
  "attendance_history_title": "Attendance History",
  "attendance_chronic_alert": "Chronic Absenteeism Alert",
  "attendance_chronic_msg": "{name} has {count} unexcused absences this month",

  "leave_title": "Leave Requests",
  "leave_new": "New Leave Request",
  "leave_type_label": "Leave Type",
  "leave_type_sick": "Sick Leave",
  "leave_type_excused": "Excused Leave",
  "leave_start_date": "Start Date",
  "leave_end_date": "End Date",
  "leave_reason": "Reason",
  "leave_reason_placeholder": "Describe the reason for absence...",
  "leave_submit": "Submit Request",
  "leave_submitting": "Submitting...",
  "leave_delete": "Delete Request",
  "leave_delete_confirm": "Are you sure you want to delete this leave request?",
  "leave_status_pending": "Pending",
  "leave_status_approved": "Approved",
  "leave_status_rejected": "Rejected",
  "leave_no_requests": "No leave requests",
  "leave_requests_title": "Leave Requests",
  "leave_approve": "Approve",
  "leave_reject": "Reject",
  "leave_rejection_reason": "Rejection Reason",
  "leave_rejection_placeholder": "Reason for rejection (optional)...",
  "leave_reviewed_by": "Reviewed by",
  "leave_days": "{count} day(s)",
  "leave_child_label": "Child"
```

**Step 2: Add attendance keys to id.json**

```json
  "attendance_title": "Kehadiran",
  "attendance_date_label": "Tanggal",
  "attendance_classroom_label": "Kelas",
  "attendance_mark_all": "Tandai Semua Hadir",
  "attendance_save": "Simpan Kehadiran",
  "attendance_saving": "Menyimpan...",
  "attendance_saved": "Kehadiran berhasil disimpan",
  "attendance_status_present": "Hadir",
  "attendance_status_sick": "Sakit",
  "attendance_status_excused": "Izin",
  "attendance_status_unexcused": "Alpha",
  "attendance_status_not_marked": "Belum Dicatat",
  "attendance_no_students": "Tidak ada siswa di kelas ini",
  "attendance_summary_title": "Ringkasan Kehadiran",
  "attendance_summary_rate": "Tingkat Kehadiran",
  "attendance_summary_total_days": "Total Hari",
  "attendance_history_title": "Riwayat Kehadiran",
  "attendance_chronic_alert": "Peringatan Ketidakhadiran Kronis",
  "attendance_chronic_msg": "{name} memiliki {count} ketidakhadiran tanpa keterangan bulan ini",

  "leave_title": "Permohonan Izin",
  "leave_new": "Permohonan Baru",
  "leave_type_label": "Jenis Izin",
  "leave_type_sick": "Sakit",
  "leave_type_excused": "Izin",
  "leave_start_date": "Tanggal Mulai",
  "leave_end_date": "Tanggal Selesai",
  "leave_reason": "Alasan",
  "leave_reason_placeholder": "Jelaskan alasan ketidakhadiran...",
  "leave_submit": "Kirim Permohonan",
  "leave_submitting": "Mengirim...",
  "leave_delete": "Hapus Permohonan",
  "leave_delete_confirm": "Apakah Anda yakin ingin menghapus permohonan izin ini?",
  "leave_status_pending": "Menunggu",
  "leave_status_approved": "Disetujui",
  "leave_status_rejected": "Ditolak",
  "leave_no_requests": "Tidak ada permohonan izin",
  "leave_requests_title": "Permohonan Izin",
  "leave_approve": "Setujui",
  "leave_reject": "Tolak",
  "leave_rejection_reason": "Alasan Penolakan",
  "leave_rejection_placeholder": "Alasan penolakan (opsional)...",
  "leave_reviewed_by": "Ditinjau oleh",
  "leave_days": "{count} hari",
  "leave_child_label": "Anak"
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add i18n keys for attendance and leave requests (EN/ID)"
```

---

## Phase 5: Frontend Pages

### Task 10: Teacher attendance page

**Files:**
- Create: `front-end/src/routes/teacher/attendance/+page.server.ts`
- Create: `front-end/src/routes/teacher/attendance/+page.svelte`

This page shows a date picker, classroom selector, and a list of students with status toggles (Present/Sick/Excused/Unexcused). Teacher can bulk-save.

Follow the pattern from `teacher/students/[id]/health/+page.svelte`:
- Use `$props()` for data/form
- Use `use:enhance` for form submission
- Use `m.*()` for all strings
- Tailwind CSS for styling
- Segmented radio buttons per student for status selection

The `+page.server.ts` should:
- Load classrooms for the teacher
- Load students for selected classroom
- Load existing attendance for selected date
- Handle POST action to call `bulkRecordAttendance` mutation

**Step 1: Implement the page (server + svelte)**

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add teacher attendance page with bulk marking"
```

---

### Task 11: Teacher leave requests page

**Files:**
- Create: `front-end/src/routes/teacher/attendance/requests/+page.server.ts`
- Create: `front-end/src/routes/teacher/attendance/requests/+page.svelte`

Shows pending leave requests as cards. Each card has student name, type badge, date range, reason, and Approve/Reject buttons. Filter by classroom and status.

**Step 1: Implement the page**

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add teacher leave request review page"
```

---

### Task 12: Parent attendance history page

**Files:**
- Create: `front-end/src/routes/parent/attendance/+page.server.ts`
- Create: `front-end/src/routes/parent/attendance/+page.svelte`

Shows per-child attendance history as a list with status badges. Summary stats at top (% present, sick, excused, unexcused). Child selector if parent has multiple children.

**Step 1: Implement the page**

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add parent attendance history page"
```

---

### Task 13: Parent leave request page

**Files:**
- Create: `front-end/src/routes/parent/attendance/leave/+page.server.ts`
- Create: `front-end/src/routes/parent/attendance/leave/+page.svelte`

Shows list of own leave requests with status badges. "New Request" button toggles a form with: child selector, type (sick/excused), date range, reason. Delete button on pending requests with confirmation.

**Step 1: Implement the page**

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add parent leave request submission page"
```

---

### Task 14: School manager attendance dashboard

**Files:**
- Create: `front-end/src/routes/school/attendance/+page.server.ts`
- Create: `front-end/src/routes/school/attendance/+page.svelte`

Dashboard with per-classroom attendance rate cards. Date range filter. Drill-down to classroom detail. Chronic absenteeism alerts section (students with ≥3 unexcused in current month).

**Step 1: Implement the page**

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add school manager attendance dashboard"
```

---

### Task 15: Add attendance to navigation

**Files:**
- Modify: `front-end/src/lib/components/layout/Navbar.svelte` (or wherever nav links are defined)
- Add `nav_attendance` key to en.json/id.json if not already added

Add "Attendance" nav link for teacher, parent, and school manager roles.

**Step 1: Add nav links**

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add attendance navigation links for all roles"
```

---

## Phase 6: Verification

### Task 16: Full build and test verification

**Step 1: Run backend tests**

Run: `cd backend && bin/rails test`
Expected: All tests pass.

**Step 2: Run frontend build**

Run: `cd front-end && npx vite build`
Expected: Build succeeds.

**Step 3: Final commit if any fixes needed**

**Step 4: Push to main**

```bash
git push origin main
```

**Step 5: Save completion doc to Outline**

Create document in GrewMe collection with implementation summary.
