# Behavior Points System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a ClassDojo-style behavior points system where school managers configure behavior categories, teachers award/revoke points in real-time, and parents view weekly reports.

**Architecture:** Three new models (BehaviorCategory, BehaviorPoint, BehaviorSummary) with GraphQL mutations/queries, Pundit policies, ActionCable channel for live projection display, Solid Queue job for weekly summaries, and SvelteKit pages for all three roles (teacher, school manager, parent).

**Tech Stack:** Rails 8.1.2, GraphQL (graphql-ruby), Pundit, ActionCable, Solid Queue, SvelteKit 5 (Svelte 5 runes), Tailwind CSS v4, Paraglide i18n

**Spec:** `docs/superpowers/specs/2026-03-15-behavior-points-system-design.md`

---

## File Structure

### Backend (Create)

| File | Responsibility |
|------|---------------|
| `backend/db/migrate/TIMESTAMP_create_behavior_tables.rb` | Migration for all 3 tables |
| `backend/app/models/behavior_category.rb` | Behavior category model (school-scoped) |
| `backend/app/models/behavior_point.rb` | Individual point award record |
| `backend/app/models/behavior_summary.rb` | Cached weekly aggregation |
| `backend/app/graphql/types/behavior_category_type.rb` | GraphQL type |
| `backend/app/graphql/types/behavior_point_type.rb` | GraphQL type |
| `backend/app/graphql/types/behavior_summary_type.rb` | GraphQL type |
| `backend/app/graphql/types/classroom_behavior_student_type.rb` | Composite type for classroom view |
| `backend/app/graphql/mutations/create_behavior_category.rb` | SM creates category |
| `backend/app/graphql/mutations/update_behavior_category.rb` | SM updates category |
| `backend/app/graphql/mutations/delete_behavior_category.rb` | SM soft-deletes category |
| `backend/app/graphql/mutations/reorder_behavior_categories.rb` | SM reorders categories |
| `backend/app/graphql/mutations/award_behavior_point.rb` | Teacher awards single point |
| `backend/app/graphql/mutations/batch_award_behavior_points.rb` | Teacher awards to multiple students |
| `backend/app/graphql/mutations/revoke_behavior_point.rb` | Teacher undoes a point |
| `backend/app/policies/behavior_category_policy.rb` | Pundit policy |
| `backend/app/policies/behavior_point_policy.rb` | Pundit policy |
| `backend/app/policies/behavior_summary_policy.rb` | Pundit policy |
| `backend/app/channels/behavior_channel.rb` | ActionCable channel |
| `backend/app/jobs/generate_behavior_summaries_job.rb` | Weekly summary generation |
| `backend/test/fixtures/behavior_categories.yml` | Test fixtures |
| `backend/test/fixtures/behavior_points.yml` | Test fixtures |
| `backend/test/fixtures/behavior_summaries.yml` | Test fixtures |
| `backend/test/models/behavior_category_test.rb` | Model tests |
| `backend/test/models/behavior_point_test.rb` | Model tests |
| `backend/test/models/behavior_summary_test.rb` | Model tests |
| `backend/test/graphql/mutations/behavior_categories_test.rb` | Mutation tests |
| `backend/test/graphql/mutations/behavior_points_test.rb` | Mutation tests |

### Backend (Modify)

| File | Change |
|------|--------|
| `backend/app/models/school.rb` | Add `has_many :behavior_categories` |
| `backend/app/models/student.rb` | Add `has_many :behavior_points` |
| `backend/app/models/teacher.rb` | Add `has_many :awarded_behavior_points` |
| `backend/app/models/classroom.rb` | Add `has_many :behavior_points` |
| `backend/app/graphql/types/query_type.rb` | Add behavior queries |
| `backend/app/graphql/types/mutation_type.rb` | Register behavior mutations |
| `backend/db/seeds.rb` | Add behavior seed data |

### Frontend (Create)

| File | Responsibility |
|------|---------------|
| `front-end/src/lib/api/queries/behavior.ts` | GraphQL queries & mutations |
| `front-end/src/routes/teacher/classrooms/[id]/behavior/+page.svelte` | Teacher awarding page |
| `front-end/src/routes/teacher/classrooms/[id]/behavior/display/+page.svelte` | Projection display |
| `front-end/src/routes/teacher/students/[id]/behavior/+page.svelte` | Student behavior detail |
| `front-end/src/routes/school/behavior/categories/+page.svelte` | SM category management |
| `front-end/src/routes/school/behavior/+page.svelte` | SM behavior dashboard |
| `front-end/src/routes/parent/children/[id]/behavior/+page.svelte` | Parent weekly report |

### Frontend (Modify)

| File | Change |
|------|--------|
| `front-end/src/routes/teacher/+layout.svelte` | Add behavior nav item |
| `front-end/src/routes/school/+layout.svelte` | Add behavior nav item |
| `front-end/src/messages/en.json` | Add i18n keys |
| `front-end/src/messages/id.json` | Add i18n keys |

---

## Chunk 1: Backend Models, Migration & Fixtures

### Task 1: Create migration for behavior tables

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_create_behavior_tables.rb`

- [ ] **Step 1: Generate migration**

Run:
```bash
cd backend && bin/rails generate migration CreateBehaviorTables
```

- [ ] **Step 2: Write migration**

Edit the generated file:

```ruby
class CreateBehaviorTables < ActiveRecord::Migration[8.1]
  def change
    safety_assured do
      create_table :behavior_categories do |t|
        t.references :school, null: false, foreign_key: true
        t.string :name, null: false
        t.text :description
        t.integer :point_value, null: false
        t.boolean :is_positive, null: false, default: true
        t.string :icon, null: false
        t.string :color, null: false
        t.integer :position, null: false, default: 0
        t.datetime :deleted_at
        t.timestamps
      end

      add_index :behavior_categories, [:school_id, :name], unique: true, where: "deleted_at IS NULL", name: "idx_behavior_categories_unique_name_per_school"

      create_table :behavior_points do |t|
        t.references :student, null: false, foreign_key: true
        t.references :teacher, null: false, foreign_key: true
        t.references :classroom, null: false, foreign_key: true
        t.references :behavior_category, null: false, foreign_key: true
        t.integer :point_value, null: false
        t.text :note
        t.datetime :awarded_at, null: false
        t.datetime :revoked_at
        t.timestamps
      end

      add_index :behavior_points, [:student_id, :awarded_at]
      add_index :behavior_points, [:classroom_id, :awarded_at]

      create_table :behavior_summaries do |t|
        t.references :student, null: false, foreign_key: true
        t.references :classroom, null: false, foreign_key: true
        t.date :week_start, null: false
        t.integer :total_points, null: false, default: 0
        t.integer :positive_count, null: false, default: 0
        t.integer :negative_count, null: false, default: 0
        t.references :top_behavior_category, foreign_key: { to_table: :behavior_categories }
        t.timestamps
      end

      add_index :behavior_summaries, [:student_id, :classroom_id, :week_start], unique: true, name: "idx_behavior_summaries_unique_per_student_week"
    end
  end
end
```

- [ ] **Step 3: Run migration**

Run: `cd backend && bin/rails db:migrate`
Expected: Tables created successfully

- [ ] **Step 4: Commit**

```bash
git add backend/db/migrate/ backend/db/schema.rb
git commit -m "feat(behavior): add migration for behavior_categories, behavior_points, behavior_summaries"
```

---

### Task 2: Create BehaviorCategory model

**Files:**
- Create: `backend/app/models/behavior_category.rb`
- Create: `backend/test/models/behavior_category_test.rb`
- Create: `backend/test/fixtures/behavior_categories.yml`
- Modify: `backend/app/models/school.rb`

- [ ] **Step 1: Create fixtures**

Create `backend/test/fixtures/behavior_categories.yml`:

```yaml
helping_others:
  school: greenwood
  name: "Helping Others"
  point_value: 3
  is_positive: true
  icon: "🤝"
  color: "#059669"
  position: 0

teamwork:
  school: greenwood
  name: "Teamwork"
  point_value: 2
  is_positive: true
  icon: "👥"
  color: "#2563eb"
  position: 1

leadership:
  school: greenwood
  name: "Leadership"
  point_value: 5
  is_positive: true
  icon: "⭐"
  color: "#7c3aed"
  position: 2

working_hard:
  school: greenwood
  name: "Working Hard"
  point_value: 2
  is_positive: true
  icon: "💪"
  color: "#d97706"
  position: 3

being_respectful:
  school: greenwood
  name: "Being Respectful"
  point_value: 1
  is_positive: true
  icon: "🙏"
  color: "#0891b2"
  position: 4

off_task:
  school: greenwood
  name: "Off-task"
  point_value: -1
  is_positive: false
  icon: "📵"
  color: "#dc2626"
  position: 5

disruptive:
  school: greenwood
  name: "Disruptive"
  point_value: -2
  is_positive: false
  icon: "🔊"
  color: "#b91c1c"
  position: 6

late_behavior:
  school: greenwood
  name: "Late"
  point_value: -1
  is_positive: false
  icon: "⏰"
  color: "#9f1239"
  position: 7
```

- [ ] **Step 2: Write failing model test**

Create `backend/test/models/behavior_category_test.rb`:

```ruby
require "test_helper"

class BehaviorCategoryTest < ActiveSupport::TestCase
  test "validates name presence" do
    cat = BehaviorCategory.new(school: schools(:greenwood), point_value: 3, is_positive: true, icon: "🤝", color: "#059669")
    assert_not cat.valid?
    assert_includes cat.errors[:name], "can't be blank"
  end

  test "validates name uniqueness per school" do
    existing = behavior_categories(:helping_others)
    dup = BehaviorCategory.new(
      school: existing.school,
      name: existing.name,
      point_value: 1,
      is_positive: true,
      icon: "✨",
      color: "#000000"
    )
    assert_not dup.valid?
    assert_includes dup.errors[:name], "has already been taken"
  end

  test "validates point_value range -5 to 5 and not zero" do
    base = { school: schools(:greenwood), name: "Test", is_positive: true, icon: "✨", color: "#000000" }

    assert_not BehaviorCategory.new(base.merge(point_value: 0)).valid?
    assert_not BehaviorCategory.new(base.merge(point_value: -6)).valid?
    assert_not BehaviorCategory.new(base.merge(point_value: 6)).valid?
    assert BehaviorCategory.new(base.merge(point_value: 1, name: "A")).valid?
    assert BehaviorCategory.new(base.merge(point_value: -5, is_positive: false, name: "B")).valid?
    assert BehaviorCategory.new(base.merge(point_value: 5, name: "C")).valid?
  end

  test "validates icon and color presence" do
    base = { school: schools(:greenwood), name: "Test", point_value: 1, is_positive: true }
    assert_not BehaviorCategory.new(base.merge(icon: nil, color: "#000")).valid?
    assert_not BehaviorCategory.new(base.merge(icon: "✨", color: nil)).valid?
  end

  test "belongs to school" do
    cat = behavior_categories(:helping_others)
    assert_equal schools(:greenwood), cat.school
  end

  test "scope active excludes soft-deleted" do
    cat = behavior_categories(:helping_others)
    assert_includes BehaviorCategory.active, cat

    cat.update!(deleted_at: Time.current)
    assert_not_includes BehaviorCategory.active, cat
  end

  test "scope positive and negative" do
    assert_includes BehaviorCategory.positive, behavior_categories(:helping_others)
    assert_includes BehaviorCategory.negative, behavior_categories(:off_task)
    assert_not_includes BehaviorCategory.positive, behavior_categories(:off_task)
  end

  test "soft_delete! sets deleted_at" do
    cat = behavior_categories(:helping_others)
    assert_nil cat.deleted_at
    cat.soft_delete!
    assert_not_nil cat.reload.deleted_at
  end
end
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && bin/rails test test/models/behavior_category_test.rb`
Expected: FAIL — BehaviorCategory not defined

- [ ] **Step 4: Write BehaviorCategory model**

Create `backend/app/models/behavior_category.rb`:

```ruby
class BehaviorCategory < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :school
  has_many :behavior_points, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { scope: :school_id, conditions: -> { where(deleted_at: nil) } }
  validates :point_value, presence: true, numericality: { only_integer: true, in: -5..5, other_than: 0 }
  validates :is_positive, inclusion: { in: [true, false] }
  validates :icon, presence: true
  validates :color, presence: true, format: { with: /\A#[0-9a-fA-F]{6}\z/, message: "must be a valid hex color" }

  scope :active, -> { where(deleted_at: nil) }
  scope :positive, -> { where(is_positive: true) }
  scope :negative, -> { where(is_positive: false) }
  scope :ordered, -> { order(:position) }

  before_validation :set_is_positive, if: :point_value_changed?

  def soft_delete!
    update!(deleted_at: Time.current)
  end

  def deleted?
    deleted_at.present?
  end

  private

  def set_is_positive
    self.is_positive = point_value.to_i > 0 if point_value.present?
  end
end
```

- [ ] **Step 5: Add association to School model**

In `backend/app/models/school.rb`, add after the existing `has_many` lines:

```ruby
has_many :behavior_categories, dependent: :destroy
```

- [ ] **Step 6: Run tests**

Run: `cd backend && bin/rails test test/models/behavior_category_test.rb`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/behavior_category.rb backend/app/models/school.rb backend/test/models/behavior_category_test.rb backend/test/fixtures/behavior_categories.yml
git commit -m "feat(behavior): add BehaviorCategory model with validations and tests"
```

---

### Task 3: Create BehaviorPoint model

**Files:**
- Create: `backend/app/models/behavior_point.rb`
- Create: `backend/test/models/behavior_point_test.rb`
- Create: `backend/test/fixtures/behavior_points.yml`
- Modify: `backend/app/models/student.rb`
- Modify: `backend/app/models/teacher.rb`
- Modify: `backend/app/models/classroom.rb`

- [ ] **Step 1: Create fixtures**

Create `backend/test/fixtures/behavior_points.yml`:

```yaml
emma_helping:
  student: student_emma
  teacher: teacher_alice
  classroom: alice_class
  behavior_category: helping_others
  point_value: 3
  awarded_at: "2026-03-15 09:00:00"

emma_teamwork:
  student: student_emma
  teacher: teacher_alice
  classroom: alice_class
  behavior_category: teamwork
  point_value: 2
  awarded_at: "2026-03-15 10:30:00"

emma_off_task:
  student: student_emma
  teacher: teacher_alice
  classroom: alice_class
  behavior_category: off_task
  point_value: -1
  awarded_at: "2026-03-15 14:00:00"

finn_leadership:
  student: student_finn
  teacher: teacher_alice
  classroom: alice_class
  behavior_category: leadership
  point_value: 5
  awarded_at: "2026-03-15 11:00:00"

revoked_point:
  student: student_emma
  teacher: teacher_alice
  classroom: alice_class
  behavior_category: disruptive
  point_value: -2
  awarded_at: "2026-03-15 13:00:00"
  revoked_at: "2026-03-15 13:05:00"
```

- [ ] **Step 2: Write failing model test**

Create `backend/test/models/behavior_point_test.rb`:

```ruby
require "test_helper"

class BehaviorPointTest < ActiveSupport::TestCase
  test "validates all associations present" do
    bp = BehaviorPoint.new(point_value: 3, awarded_at: Time.current)
    assert_not bp.valid?
    assert_includes bp.errors[:student], "must exist"
    assert_includes bp.errors[:teacher], "must exist"
    assert_includes bp.errors[:classroom], "must exist"
    assert_includes bp.errors[:behavior_category], "must exist"
  end

  test "validates point_value range" do
    base = {
      student: students(:student_emma),
      teacher: teachers(:teacher_alice),
      classroom: classrooms(:alice_class),
      behavior_category: behavior_categories(:helping_others),
      awarded_at: Time.current
    }
    assert_not BehaviorPoint.new(base.merge(point_value: 0)).valid?
    assert_not BehaviorPoint.new(base.merge(point_value: 6)).valid?
    assert_not BehaviorPoint.new(base.merge(point_value: -6)).valid?
    assert BehaviorPoint.new(base.merge(point_value: 3)).valid?
  end

  test "validates awarded_at presence" do
    bp = BehaviorPoint.new(
      student: students(:student_emma),
      teacher: teachers(:teacher_alice),
      classroom: classrooms(:alice_class),
      behavior_category: behavior_categories(:helping_others),
      point_value: 3
    )
    assert_not bp.valid?
    assert_includes bp.errors[:awarded_at], "can't be blank"
  end

  test "scope active excludes revoked" do
    active = behavior_points(:emma_helping)
    revoked = behavior_points(:revoked_point)
    assert_includes BehaviorPoint.active, active
    assert_not_includes BehaviorPoint.active, revoked
  end

  test "scope today filters by awarded_at" do
    point = behavior_points(:emma_helping)
    # Fixture date is 2026-03-15, so we check it's included when "today" matches
    assert BehaviorPoint.for_date(point.awarded_at.to_date).include?(point)
  end

  test "scope positive and negative" do
    assert_includes BehaviorPoint.positive, behavior_points(:emma_helping)
    assert_includes BehaviorPoint.negative, behavior_points(:emma_off_task)
  end

  test "revokable? returns true within 15 minutes" do
    point = BehaviorPoint.new(awarded_at: 10.minutes.ago, revoked_at: nil)
    assert point.revokable?
  end

  test "revokable? returns false after 15 minutes" do
    point = BehaviorPoint.new(awarded_at: 20.minutes.ago, revoked_at: nil)
    assert_not point.revokable?
  end

  test "revokable? returns false if already revoked" do
    point = BehaviorPoint.new(awarded_at: 5.minutes.ago, revoked_at: 3.minutes.ago)
    assert_not point.revokable?
  end

  test "revoke! sets revoked_at" do
    point = behavior_points(:emma_helping)
    point.update!(awarded_at: 5.minutes.ago)
    point.revoke!
    assert_not_nil point.reload.revoked_at
  end

  test "belongs to student, teacher, classroom, behavior_category" do
    point = behavior_points(:emma_helping)
    assert_equal students(:student_emma), point.student
    assert_equal teachers(:teacher_alice), point.teacher
    assert_equal classrooms(:alice_class), point.classroom
    assert_equal behavior_categories(:helping_others), point.behavior_category
  end
end
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && bin/rails test test/models/behavior_point_test.rb`
Expected: FAIL — BehaviorPoint not defined

- [ ] **Step 4: Write BehaviorPoint model**

Create `backend/app/models/behavior_point.rb`:

```ruby
class BehaviorPoint < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :student
  belongs_to :teacher
  belongs_to :classroom
  belongs_to :behavior_category

  validates :point_value, presence: true, numericality: { only_integer: true, in: -5..5, other_than: 0 }
  validates :awarded_at, presence: true

  scope :active, -> { where(revoked_at: nil) }
  scope :positive, -> { where("point_value > 0") }
  scope :negative, -> { where("point_value < 0") }
  scope :for_date, ->(date) { where(awarded_at: date.beginning_of_day..date.end_of_day) }
  scope :for_week, ->(date) { where(awarded_at: date.beginning_of_week..date.end_of_week) }

  def revokable?
    revoked_at.nil? && awarded_at > 15.minutes.ago
  end

  def revoke!
    raise "Cannot revoke: outside 15-minute window" unless revokable?
    update!(revoked_at: Time.current)
  end

  def revoked?
    revoked_at.present?
  end
end
```

- [ ] **Step 5: Add associations to existing models**

In `backend/app/models/student.rb`, add:
```ruby
has_many :behavior_points, dependent: :destroy
has_many :behavior_summaries, dependent: :destroy
```

In `backend/app/models/teacher.rb`, add:
```ruby
has_many :awarded_behavior_points, class_name: "BehaviorPoint", foreign_key: :teacher_id, dependent: :destroy, inverse_of: :teacher
```

In `backend/app/models/classroom.rb`, add:
```ruby
has_many :behavior_points, dependent: :destroy
has_many :behavior_summaries, dependent: :destroy
```

- [ ] **Step 6: Run tests**

Run: `cd backend && bin/rails test test/models/behavior_point_test.rb`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/behavior_point.rb backend/app/models/student.rb backend/app/models/teacher.rb backend/app/models/classroom.rb backend/test/models/behavior_point_test.rb backend/test/fixtures/behavior_points.yml
git commit -m "feat(behavior): add BehaviorPoint model with scopes, revoke logic, and tests"
```

---

### Task 4: Create BehaviorSummary model

**Files:**
- Create: `backend/app/models/behavior_summary.rb`
- Create: `backend/test/models/behavior_summary_test.rb`
- Create: `backend/test/fixtures/behavior_summaries.yml`

- [ ] **Step 1: Create fixtures**

Create `backend/test/fixtures/behavior_summaries.yml`:

```yaml
emma_week1:
  student: student_emma
  classroom: alice_class
  week_start: "2026-03-09"
  total_points: 12
  positive_count: 5
  negative_count: 1
  top_behavior_category: helping_others

finn_week1:
  student: student_finn
  classroom: alice_class
  week_start: "2026-03-09"
  total_points: 8
  positive_count: 3
  negative_count: 0
  top_behavior_category: leadership
```

- [ ] **Step 2: Write failing test**

Create `backend/test/models/behavior_summary_test.rb`:

```ruby
require "test_helper"

class BehaviorSummaryTest < ActiveSupport::TestCase
  test "validates uniqueness per student, classroom, week" do
    existing = behavior_summaries(:emma_week1)
    dup = BehaviorSummary.new(
      student: existing.student,
      classroom: existing.classroom,
      week_start: existing.week_start,
      total_points: 5,
      positive_count: 2,
      negative_count: 1
    )
    assert_not dup.valid?
  end

  test "belongs to student and classroom" do
    summary = behavior_summaries(:emma_week1)
    assert_equal students(:student_emma), summary.student
    assert_equal classrooms(:alice_class), summary.classroom
  end

  test "top_behavior_category is optional" do
    summary = BehaviorSummary.new(
      student: students(:student_finn),
      classroom: classrooms(:alice_class),
      week_start: Date.new(2026, 3, 16),
      total_points: 0,
      positive_count: 0,
      negative_count: 0,
      top_behavior_category: nil
    )
    assert summary.valid?
  end
end
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && bin/rails test test/models/behavior_summary_test.rb`
Expected: FAIL

- [ ] **Step 4: Write BehaviorSummary model**

Create `backend/app/models/behavior_summary.rb`:

```ruby
class BehaviorSummary < ApplicationRecord
  belongs_to :student
  belongs_to :classroom
  belongs_to :top_behavior_category, class_name: "BehaviorCategory", optional: true

  validates :week_start, presence: true
  validates :student_id, uniqueness: { scope: [:classroom_id, :week_start] }
  validates :total_points, presence: true
  validates :positive_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :negative_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
```

- [ ] **Step 5: Run tests**

Run: `cd backend && bin/rails test test/models/behavior_summary_test.rb`
Expected: All PASS

- [ ] **Step 6: Run all model tests to ensure no regressions**

Run: `cd backend && bin/rails test test/models/`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/behavior_summary.rb backend/test/models/behavior_summary_test.rb backend/test/fixtures/behavior_summaries.yml
git commit -m "feat(behavior): add BehaviorSummary model with weekly aggregation and tests"
```

---

## Chunk 2: GraphQL Types, Mutations & Policies

### Task 5: Create GraphQL types

**Files:**
- Create: `backend/app/graphql/types/behavior_category_type.rb`
- Create: `backend/app/graphql/types/behavior_point_type.rb`
- Create: `backend/app/graphql/types/behavior_summary_type.rb`
- Create: `backend/app/graphql/types/classroom_behavior_student_type.rb`

- [ ] **Step 1: Create BehaviorCategoryType**

Create `backend/app/graphql/types/behavior_category_type.rb`:

```ruby
module Types
  class BehaviorCategoryType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String
    field :point_value, Integer, null: false
    field :is_positive, Boolean, null: false
    field :icon, String, null: false
    field :color, String, null: false
    field :position, Integer, null: false
  end
end
```

- [ ] **Step 2: Create BehaviorPointType**

Create `backend/app/graphql/types/behavior_point_type.rb`:

```ruby
module Types
  class BehaviorPointType < Types::BaseObject
    field :id, ID, null: false
    field :point_value, Integer, null: false
    field :note, String
    field :awarded_at, GraphQL::Types::ISO8601DateTime, null: false
    field :revoked_at, GraphQL::Types::ISO8601DateTime
    field :revokable, Boolean, null: false
    field :student, Types::StudentType, null: false
    field :teacher, Types::TeacherType, null: false
    field :behavior_category, Types::BehaviorCategoryType, null: false

    def revokable
      object.revokable?
    end
  end
end
```

- [ ] **Step 3: Create BehaviorSummaryType**

Create `backend/app/graphql/types/behavior_summary_type.rb`:

```ruby
module Types
  class BehaviorSummaryType < Types::BaseObject
    field :id, ID, null: false
    field :week_start, GraphQL::Types::ISO8601Date, null: false
    field :total_points, Integer, null: false
    field :positive_count, Integer, null: false
    field :negative_count, Integer, null: false
    field :student, Types::StudentType, null: false
    field :top_behavior_category, Types::BehaviorCategoryType
  end
end
```

- [ ] **Step 4: Create ClassroomBehaviorStudentType**

Create `backend/app/graphql/types/classroom_behavior_student_type.rb`:

```ruby
module Types
  class ClassroomBehaviorStudentType < Types::BaseObject
    field :student, Types::StudentType, null: false
    field :total_points, Integer, null: false
    field :positive_count, Integer, null: false
    field :negative_count, Integer, null: false
    field :recent_points, [Types::BehaviorPointType], null: false
  end
end
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/graphql/types/behavior_*.rb backend/app/graphql/types/classroom_behavior_student_type.rb
git commit -m "feat(behavior): add GraphQL types for behavior system"
```

---

### Task 6: Create Pundit policies

**Files:**
- Create: `backend/app/policies/behavior_category_policy.rb`
- Create: `backend/app/policies/behavior_point_policy.rb`

- [ ] **Step 1: Create BehaviorCategoryPolicy**

Create `backend/app/policies/behavior_category_policy.rb`:

```ruby
class BehaviorCategoryPolicy < ApplicationPolicy
  def index?
    user.school_manager? || user.teacher? || user.admin?
  end

  def create?
    user.admin? || (user.school_manager? && record.school_id == user.school_id)
  end

  def update?
    create?
  end

  def destroy?
    create?
  end

  def reorder?
    create?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.where(school_id: user.school_id)
      elsif user.teacher?
        scope.where(school_id: user.school_id)
      else
        scope.none
      end
    end
  end
end
```

- [ ] **Step 2: Create BehaviorPointPolicy**

Create `backend/app/policies/behavior_point_policy.rb`:

```ruby
class BehaviorPointPolicy < ApplicationPolicy
  def create?
    user.teacher? && user.classrooms.exists?(id: record.classroom_id)
  end

  def revoke?
    user.teacher? && record.teacher_id == user.id && record.revokable?
  end

  def index?
    true # scoped via Scope class
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.joins(classroom: :school).where(schools: { id: user.school_id })
      elsif user.teacher?
        scope.where(classroom_id: user.classroom_ids)
      elsif user.parent?
        scope.joins(student: :parent_students).where(parent_students: { parent_id: user.id })
      else
        scope.none
      end
    end
  end
end
```

- [ ] **Step 3: Create BehaviorSummaryPolicy**

Create `backend/app/policies/behavior_summary_policy.rb`:

```ruby
class BehaviorSummaryPolicy < ApplicationPolicy
  def show?
    user.admin? || teacher_of_classroom? || parent_of_student?
  end

  def index?
    user.admin? || user.school_manager? || user.teacher?
  end

  def export?
    user.admin? || user.school_manager?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.joins(classroom: :school).where(schools: { id: user.school_id })
      elsif user.teacher?
        scope.where(classroom_id: user.classroom_ids)
      elsif user.parent?
        scope.joins(student: :parent_students).where(parent_students: { parent_id: user.id })
      else
        scope.none
      end
    end
  end

  private

  def teacher_of_classroom?
    user.teacher? && user.classroom_ids.include?(record.classroom_id)
  end

  def parent_of_student?
    user.parent? && user.children.exists?(id: record.student_id)
  end
end
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/policies/behavior_category_policy.rb backend/app/policies/behavior_point_policy.rb backend/app/policies/behavior_summary_policy.rb
git commit -m "feat(behavior): add Pundit policies for behavior system"
```

---

### Task 7: Create category management mutations (SM)

**Files:**
- Create: `backend/app/graphql/mutations/create_behavior_category.rb`
- Create: `backend/app/graphql/mutations/update_behavior_category.rb`
- Create: `backend/app/graphql/mutations/delete_behavior_category.rb`
- Create: `backend/app/graphql/mutations/reorder_behavior_categories.rb`
- Create: `backend/test/graphql/mutations/behavior_categories_test.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`

- [ ] **Step 1: Create CreateBehaviorCategory mutation**

Create `backend/app/graphql/mutations/create_behavior_category.rb`:

```ruby
module Mutations
  class CreateBehaviorCategory < BaseMutation
    argument :school_id, ID, required: true
    argument :name, String, required: true
    argument :description, String, required: false
    argument :point_value, Integer, required: true
    argument :icon, String, required: true
    argument :color, String, required: true

    field :behavior_category, Types::BehaviorCategoryType
    field :errors, [Types::UserErrorType], null: false

    def resolve(school_id:, name:, point_value:, icon:, color:, description: nil)
      authenticate!

      school = School.find(school_id)
      category = school.behavior_categories.build(
        name: name,
        description: description,
        point_value: point_value,
        icon: icon,
        color: color,
        position: school.behavior_categories.active.count
      )

      raise Pundit::NotAuthorizedError unless BehaviorCategoryPolicy.new(current_user, category).create?

      if category.save
        { behavior_category: category, errors: [] }
      else
        { behavior_category: nil, errors: category.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } } }
      end
    end
  end
end
```

- [ ] **Step 2: Create UpdateBehaviorCategory mutation**

Create `backend/app/graphql/mutations/update_behavior_category.rb`:

```ruby
module Mutations
  class UpdateBehaviorCategory < BaseMutation
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :description, String, required: false
    argument :point_value, Integer, required: false
    argument :icon, String, required: false
    argument :color, String, required: false

    field :behavior_category, Types::BehaviorCategoryType
    field :errors, [Types::UserErrorType], null: false

    def resolve(id:, **attrs)
      authenticate!

      category = BehaviorCategory.find(id)
      raise Pundit::NotAuthorizedError unless BehaviorCategoryPolicy.new(current_user, category).update?

      if category.update(attrs.compact)
        { behavior_category: category, errors: [] }
      else
        { behavior_category: nil, errors: category.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } } }
      end
    end
  end
end
```

- [ ] **Step 3: Create DeleteBehaviorCategory mutation**

Create `backend/app/graphql/mutations/delete_behavior_category.rb`:

```ruby
module Mutations
  class DeleteBehaviorCategory < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [Types::UserErrorType], null: false

    def resolve(id:)
      authenticate!

      category = BehaviorCategory.find(id)
      raise Pundit::NotAuthorizedError unless BehaviorCategoryPolicy.new(current_user, category).destroy?

      category.soft_delete!
      { success: true, errors: [] }
    rescue => e
      { success: false, errors: [{ message: e.message, path: ["id"] }] }
    end
  end
end
```

- [ ] **Step 4: Create ReorderBehaviorCategories mutation**

Create `backend/app/graphql/mutations/reorder_behavior_categories.rb`:

```ruby
module Mutations
  class ReorderBehaviorCategories < BaseMutation
    argument :category_ids, [ID], required: true

    field :behavior_categories, [Types::BehaviorCategoryType], null: false
    field :errors, [Types::UserErrorType], null: false

    def resolve(category_ids:)
      authenticate!

      categories = BehaviorCategory.where(id: category_ids)
      raise Pundit::NotAuthorizedError unless categories.all? { |c| BehaviorCategoryPolicy.new(current_user, c).reorder? }

      category_ids.each_with_index do |id, index|
        BehaviorCategory.where(id: id).update_all(position: index)
      end

      { behavior_categories: BehaviorCategory.where(id: category_ids).order(:position), errors: [] }
    end
  end
end
```

- [ ] **Step 5: Register mutations in MutationType**

In `backend/app/graphql/types/mutation_type.rb`, add:

```ruby
# Behavior
field :create_behavior_category, mutation: Mutations::CreateBehaviorCategory
field :update_behavior_category, mutation: Mutations::UpdateBehaviorCategory
field :delete_behavior_category, mutation: Mutations::DeleteBehaviorCategory
field :reorder_behavior_categories, mutation: Mutations::ReorderBehaviorCategories
```

- [ ] **Step 6: Write mutation tests**

Create `backend/test/graphql/mutations/behavior_categories_test.rb`:

```ruby
require "test_helper"

class BehaviorCategoriesMutationTest < ActiveSupport::TestCase
  CREATE_MUTATION = <<~GRAPHQL
    mutation($schoolId: ID!, $name: String!, $pointValue: Int!, $icon: String!, $color: String!) {
      createBehaviorCategory(schoolId: $schoolId, name: $name, pointValue: $pointValue, icon: $icon, color: $color) {
        behaviorCategory { id name pointValue isPositive icon color position }
        errors { message path }
      }
    }
  GRAPHQL

  UPDATE_MUTATION = <<~GRAPHQL
    mutation($id: ID!, $name: String, $pointValue: Int) {
      updateBehaviorCategory(id: $id, name: $name, pointValue: $pointValue) {
        behaviorCategory { id name pointValue }
        errors { message path }
      }
    }
  GRAPHQL

  DELETE_MUTATION = <<~GRAPHQL
    mutation($id: ID!) {
      deleteBehaviorCategory(id: $id) {
        success
        errors { message path }
      }
    }
  GRAPHQL

  test "school manager creates behavior category" do
    sm = school_managers(:manager_pat)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { schoolId: schools(:greenwood).id.to_s, name: "Focus", pointValue: 2, icon: "🎯", color: "#10b981" },
      user: sm
    )
    data = gql_data(result)["createBehaviorCategory"]
    assert_empty data["errors"]
    assert_equal "Focus", data["behaviorCategory"]["name"]
    assert_equal 2, data["behaviorCategory"]["pointValue"]
    assert data["behaviorCategory"]["isPositive"]
  end

  test "teacher cannot create behavior category" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { schoolId: schools(:greenwood).id.to_s, name: "Focus", pointValue: 2, icon: "🎯", color: "#10b981" },
      user: teacher
    )
    assert_not_nil gql_errors(result)
  end

  test "school manager updates behavior category" do
    sm = school_managers(:manager_pat)
    cat = behavior_categories(:helping_others)
    result = execute_query(
      mutation: UPDATE_MUTATION,
      variables: { id: cat.id.to_s, name: "Helping Friends", pointValue: 4 },
      user: sm
    )
    data = gql_data(result)["updateBehaviorCategory"]
    assert_empty data["errors"]
    assert_equal "Helping Friends", data["behaviorCategory"]["name"]
    assert_equal 4, data["behaviorCategory"]["pointValue"]
  end

  test "school manager soft-deletes behavior category" do
    sm = school_managers(:manager_pat)
    cat = behavior_categories(:late_behavior)
    result = execute_query(
      mutation: DELETE_MUTATION,
      variables: { id: cat.id.to_s },
      user: sm
    )
    data = gql_data(result)["deleteBehaviorCategory"]
    assert data["success"]
    assert_not_nil cat.reload.deleted_at
  end

  test "unauthenticated user cannot create" do
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { schoolId: schools(:greenwood).id.to_s, name: "X", pointValue: 1, icon: "✨", color: "#000000" }
    )
    assert_not_nil gql_errors(result)
  end
end
```

- [ ] **Step 7: Run tests**

Run: `cd backend && bin/rails test test/graphql/mutations/behavior_categories_test.rb`
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add backend/app/graphql/mutations/create_behavior_category.rb backend/app/graphql/mutations/update_behavior_category.rb backend/app/graphql/mutations/delete_behavior_category.rb backend/app/graphql/mutations/reorder_behavior_categories.rb backend/app/graphql/types/mutation_type.rb backend/test/graphql/mutations/behavior_categories_test.rb
git commit -m "feat(behavior): add category CRUD mutations with tests"
```

---

### Task 8: Create point awarding mutations + ActionCable channel

**Files:**
- Create: `backend/app/graphql/mutations/award_behavior_point.rb`
- Create: `backend/app/graphql/mutations/batch_award_behavior_points.rb`
- Create: `backend/app/graphql/mutations/revoke_behavior_point.rb`
- Create: `backend/app/channels/behavior_channel.rb`
- Create: `backend/test/graphql/mutations/behavior_points_test.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`

- [ ] **Step 1: Create BehaviorChannel**

Create `backend/app/channels/behavior_channel.rb`:

```ruby
class BehaviorChannel < ApplicationCable::Channel
  def subscribed
    classroom = Classroom.find(params[:classroom_id])

    unless current_user.teacher? && current_user.classrooms.exists?(id: classroom.id)
      reject
      return
    end

    stream_for classroom
  end

  def unsubscribed
    # Cleanup when channel is unsubscribed
  end
end
```

- [ ] **Step 2: Create AwardBehaviorPoint mutation**

Create `backend/app/graphql/mutations/award_behavior_point.rb`:

```ruby
module Mutations
  class AwardBehaviorPoint < BaseMutation
    argument :student_id, ID, required: true
    argument :classroom_id, ID, required: true
    argument :behavior_category_id, ID, required: true
    argument :note, String, required: false

    field :behavior_point, Types::BehaviorPointType
    field :daily_total, Integer, null: false
    field :errors, [Types::UserErrorType], null: false

    def resolve(student_id:, classroom_id:, behavior_category_id:, note: nil)
      authenticate!

      category = BehaviorCategory.active.find(behavior_category_id)
      classroom = Classroom.find(classroom_id)
      student = Student.find(student_id)

      # Rate limit: 1 point per student per behavior per 30 seconds
      cache_key = "behavior_point:#{student_id}:#{behavior_category_id}"
      if Rails.cache.exist?(cache_key)
        return { behavior_point: nil, daily_total: 0, errors: [{ message: "Point already awarded recently. Wait before awarding again.", path: ["behaviorCategoryId"] }] }
      end

      point = BehaviorPoint.new(
        student: student,
        teacher: current_user,
        classroom: classroom,
        behavior_category: category,
        point_value: category.point_value,
        note: note,
        awarded_at: Time.current
      )

      raise Pundit::NotAuthorizedError unless BehaviorPointPolicy.new(current_user, point).create?

      if point.save
        Rails.cache.write(cache_key, true, expires_in: 30.seconds)

        daily_total = BehaviorPoint.active.where(student_id: student_id, classroom_id: classroom_id)
          .for_date(Date.current).sum(:point_value)

        # Broadcast to projection display
        BehaviorChannel.broadcast_to(classroom, {
          type: "point_awarded",
          student_id: student.id,
          student_name: student.name,
          behavior_name: category.name,
          point_value: category.point_value,
          new_daily_total: daily_total,
          is_revocation: false
        })

        { behavior_point: point, daily_total: daily_total, errors: [] }
      else
        { behavior_point: nil, daily_total: 0, errors: point.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } } }
      end
    end
  end
end
```

- [ ] **Step 3: Create BatchAwardBehaviorPoints mutation**

Create `backend/app/graphql/mutations/batch_award_behavior_points.rb`:

```ruby
module Mutations
  class BatchAwardBehaviorPoints < BaseMutation
    argument :student_ids, [ID], required: true
    argument :classroom_id, ID, required: true
    argument :behavior_category_id, ID, required: true
    argument :note, String, required: false

    field :behavior_points, [Types::BehaviorPointType], null: false
    field :errors, [Types::UserErrorType], null: false

    def resolve(student_ids:, classroom_id:, behavior_category_id:, note: nil)
      authenticate!

      category = BehaviorCategory.active.find(behavior_category_id)
      classroom = Classroom.find(classroom_id)
      created = []
      all_errors = []

      student_ids.each do |sid|
        student = Student.find(sid)
        point = BehaviorPoint.new(
          student: student,
          teacher: current_user,
          classroom: classroom,
          behavior_category: category,
          point_value: category.point_value,
          note: note,
          awarded_at: Time.current
        )

        unless BehaviorPointPolicy.new(current_user, point).create?
          all_errors << { message: "Not authorized for student #{student.name}", path: [sid] }
          next
        end

        if point.save
          created << point
        else
          point.errors.each do |e|
            all_errors << { message: "#{student.name}: #{e.full_message}", path: [sid] }
          end
        end
      end

      # Single broadcast with all updates
      if created.any?
        BehaviorChannel.broadcast_to(classroom, {
          type: "batch_awarded",
          awards: created.map do |p|
            daily_total = BehaviorPoint.active.where(student_id: p.student_id, classroom_id: classroom_id)
              .for_date(Date.current).sum(:point_value)
            {
              student_id: p.student_id,
              student_name: p.student.name,
              behavior_name: category.name,
              point_value: category.point_value,
              new_daily_total: daily_total
            }
          end
        })
      end

      { behavior_points: created, errors: all_errors }
    end
  end
end
```

- [ ] **Step 4: Create RevokeBehaviorPoint mutation**

Create `backend/app/graphql/mutations/revoke_behavior_point.rb`:

```ruby
module Mutations
  class RevokeBehaviorPoint < BaseMutation
    argument :id, ID, required: true

    field :behavior_point, Types::BehaviorPointType
    field :errors, [Types::UserErrorType], null: false

    def resolve(id:)
      authenticate!

      point = BehaviorPoint.find(id)
      raise Pundit::NotAuthorizedError unless BehaviorPointPolicy.new(current_user, point).revoke?

      point.revoke!

      daily_total = BehaviorPoint.active.where(student_id: point.student_id, classroom_id: point.classroom_id)
        .for_date(Date.current).sum(:point_value)

      BehaviorChannel.broadcast_to(point.classroom, {
        type: "point_revoked",
        student_id: point.student_id,
        student_name: point.student.name,
        behavior_name: point.behavior_category.name,
        point_value: point.point_value,
        new_daily_total: daily_total,
        is_revocation: true
      })

      { behavior_point: point, errors: [] }
    rescue RuntimeError => e
      { behavior_point: nil, errors: [{ message: e.message, path: ["id"] }] }
    end
  end
end
```

- [ ] **Step 5: Register mutations**

In `backend/app/graphql/types/mutation_type.rb`, add:

```ruby
field :award_behavior_point, mutation: Mutations::AwardBehaviorPoint
field :batch_award_behavior_points, mutation: Mutations::BatchAwardBehaviorPoints
field :revoke_behavior_point, mutation: Mutations::RevokeBehaviorPoint
```

- [ ] **Step 6: Write tests**

Create `backend/test/graphql/mutations/behavior_points_test.rb`:

```ruby
require "test_helper"

class BehaviorPointsMutationTest < ActiveSupport::TestCase
  AWARD_MUTATION = <<~GRAPHQL
    mutation($studentId: ID!, $classroomId: ID!, $behaviorCategoryId: ID!, $note: String) {
      awardBehaviorPoint(studentId: $studentId, classroomId: $classroomId, behaviorCategoryId: $behaviorCategoryId, note: $note) {
        behaviorPoint { id pointValue note awardedAt behaviorCategory { name } }
        dailyTotal
        errors { message path }
      }
    }
  GRAPHQL

  BATCH_MUTATION = <<~GRAPHQL
    mutation($studentIds: [ID!]!, $classroomId: ID!, $behaviorCategoryId: ID!) {
      batchAwardBehaviorPoints(studentIds: $studentIds, classroomId: $classroomId, behaviorCategoryId: $behaviorCategoryId) {
        behaviorPoints { id pointValue student { id } }
        errors { message path }
      }
    }
  GRAPHQL

  REVOKE_MUTATION = <<~GRAPHQL
    mutation($id: ID!) {
      revokeBehaviorPoint(id: $id) {
        behaviorPoint { id revokedAt }
        errors { message path }
      }
    }
  GRAPHQL

  test "teacher awards behavior point" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    classroom = classrooms(:alice_class)
    category = behavior_categories(:helping_others)

    result = execute_query(
      mutation: AWARD_MUTATION,
      variables: {
        studentId: student.id.to_s,
        classroomId: classroom.id.to_s,
        behaviorCategoryId: category.id.to_s,
        note: "Helped a classmate"
      },
      user: teacher
    )

    data = gql_data(result)["awardBehaviorPoint"]
    assert_empty data["errors"]
    assert_equal 3, data["behaviorPoint"]["pointValue"]
    assert_equal "Helping Others", data["behaviorPoint"]["behaviorCategory"]["name"]
    assert_equal "Helped a classmate", data["behaviorPoint"]["note"]
  end

  test "teacher batch awards to multiple students" do
    teacher = teachers(:teacher_alice)
    classroom = classrooms(:alice_class)
    category = behavior_categories(:teamwork)
    student_ids = [students(:student_emma).id.to_s, students(:student_finn).id.to_s]

    result = execute_query(
      mutation: BATCH_MUTATION,
      variables: {
        studentIds: student_ids,
        classroomId: classroom.id.to_s,
        behaviorCategoryId: category.id.to_s
      },
      user: teacher
    )

    data = gql_data(result)["batchAwardBehaviorPoints"]
    assert_empty data["errors"]
    assert_equal 2, data["behaviorPoints"].length
  end

  test "teacher revokes point within 15 minutes" do
    teacher = teachers(:teacher_alice)
    point = behavior_points(:emma_helping)
    point.update!(awarded_at: 5.minutes.ago)

    result = execute_query(
      mutation: REVOKE_MUTATION,
      variables: { id: point.id.to_s },
      user: teacher
    )

    data = gql_data(result)["revokeBehaviorPoint"]
    assert_empty data["errors"]
    assert_not_nil data["behaviorPoint"]["revokedAt"]
  end

  test "teacher cannot revoke after 15 minutes" do
    teacher = teachers(:teacher_alice)
    point = behavior_points(:emma_helping)
    point.update!(awarded_at: 20.minutes.ago)

    result = execute_query(
      mutation: REVOKE_MUTATION,
      variables: { id: point.id.to_s },
      user: teacher
    )

    assert_not_nil gql_errors(result)
  end

  test "unauthenticated user cannot award" do
    result = execute_query(
      mutation: AWARD_MUTATION,
      variables: {
        studentId: students(:student_emma).id.to_s,
        classroomId: classrooms(:alice_class).id.to_s,
        behaviorCategoryId: behavior_categories(:helping_others).id.to_s
      }
    )
    assert_not_nil gql_errors(result)
  end
end
```

- [ ] **Step 7: Run tests**

Run: `cd backend && bin/rails test test/graphql/mutations/behavior_points_test.rb`
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add backend/app/graphql/mutations/award_behavior_point.rb backend/app/graphql/mutations/batch_award_behavior_points.rb backend/app/graphql/mutations/revoke_behavior_point.rb backend/app/channels/behavior_channel.rb backend/app/graphql/types/mutation_type.rb backend/test/graphql/mutations/behavior_points_test.rb
git commit -m "feat(behavior): add point awarding mutations, ActionCable channel, and tests"
```

---

### Task 9: Add behavior queries to QueryType

**Files:**
- Modify: `backend/app/graphql/types/query_type.rb`

- [ ] **Step 1: Add queries**

In `backend/app/graphql/types/query_type.rb`, add a new section:

```ruby
# === Behavior ===

field :behavior_categories, [Types::BehaviorCategoryType], null: false,
  description: "List behavior categories for a school" do
  argument :school_id, ID, required: true
end

def behavior_categories(school_id:)
  authenticate!
  BehaviorCategoryPolicy::Scope.new(current_user, BehaviorCategory)
    .resolve.where(school_id: school_id).active.ordered
end

field :classroom_behavior_today, [Types::ClassroomBehaviorStudentType], null: false,
  description: "All students with today's behavior totals for a classroom" do
  argument :classroom_id, ID, required: true
end

def classroom_behavior_today(classroom_id:)
  authenticate!
  classroom = Classroom.find(classroom_id)
  raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).show?

  students = classroom.students.includes(:classroom_students)
  today_points = BehaviorPoint.active.where(classroom_id: classroom_id).for_date(Date.current)

  students.map do |student|
    student_points = today_points.select { |p| p.student_id == student.id }
    {
      student: student,
      total_points: student_points.sum(&:point_value),
      positive_count: student_points.count { |p| p.point_value > 0 },
      negative_count: student_points.count { |p| p.point_value < 0 },
      recent_points: student_points.sort_by(&:awarded_at).last(5)
    }
  end
end

field :student_behavior_history, [Types::BehaviorPointType], null: false,
  description: "Behavior point history for a student" do
  argument :student_id, ID, required: true
  argument :start_date, GraphQL::Types::ISO8601Date, required: false
  argument :end_date, GraphQL::Types::ISO8601Date, required: false
end

def student_behavior_history(student_id:, start_date: nil, end_date: nil)
  authenticate!
  student = Student.find(student_id)
  scope = BehaviorPointPolicy::Scope.new(current_user, BehaviorPoint).resolve
    .where(student_id: student_id).active.includes(:behavior_category, :teacher)
  scope = scope.where("awarded_at >= ?", start_date.beginning_of_day) if start_date
  scope = scope.where("awarded_at <= ?", end_date.end_of_day) if end_date
  scope.order(awarded_at: :desc)
end

field :student_weekly_report, Types::BehaviorSummaryType, null: true,
  description: "Latest weekly behavior summary for a student" do
  argument :student_id, ID, required: true
end

def student_weekly_report(student_id:)
  authenticate!
  summary = BehaviorSummary.where(student_id: student_id).order(week_start: :desc).first
  return nil unless summary
  raise Pundit::NotAuthorizedError unless BehaviorSummaryPolicy.new(current_user, summary).show?
  summary
end

field :classroom_behavior_summary, [Types::BehaviorSummaryType], null: false,
  description: "Weekly behavior summaries for all students in a classroom" do
  argument :classroom_id, ID, required: true
  argument :week_start, GraphQL::Types::ISO8601Date, required: true
end

def classroom_behavior_summary(classroom_id:, week_start:)
  authenticate!
  classroom = Classroom.find(classroom_id)
  raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).show?
  BehaviorSummary.where(classroom_id: classroom_id, week_start: week_start)
    .includes(:student, :top_behavior_category)
end

field :classroom_behavior_export, String, null: false,
  description: "Export classroom behavior data as CSV" do
  argument :classroom_id, ID, required: true
  argument :week_start, GraphQL::Types::ISO8601Date, required: true
end

def classroom_behavior_export(classroom_id:, week_start:)
  authenticate!
  classroom = Classroom.find(classroom_id)
  raise Pundit::NotAuthorizedError unless BehaviorSummaryPolicy.new(current_user, BehaviorSummary.new(classroom: classroom)).export?

  summaries = BehaviorSummary.where(classroom_id: classroom_id, week_start: week_start)
    .includes(:student, :top_behavior_category)

  csv = "Student,Total Points,Positive,Negative,Top Behavior\n"
  summaries.each do |s|
    csv += "#{s.student.name},#{s.total_points},#{s.positive_count},#{s.negative_count},#{s.top_behavior_category&.name || 'N/A'}\n"
  end
  csv
end
```

- [ ] **Step 2: Run all tests**

Run: `cd backend && bin/rails test`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add backend/app/graphql/types/query_type.rb
git commit -m "feat(behavior): add behavior queries to QueryType"
```

---

### Task 10: Add weekly summary job and seed data

**Files:**
- Create: `backend/app/jobs/generate_behavior_summaries_job.rb`
- Modify: `backend/db/seeds.rb`

- [ ] **Step 1: Create GenerateBehaviorSummariesJob**

Create `backend/app/jobs/generate_behavior_summaries_job.rb`:

```ruby
class GenerateBehaviorSummariesJob < ApplicationJob
  queue_as :default

  limits_concurrency to: 1, key: -> { "behavior-summaries" }

  def perform
    week_start = Date.current.beginning_of_week

    Classroom.find_each do |classroom|
      classroom.students.find_each do |student|
        points = BehaviorPoint.active
          .where(student_id: student.id, classroom_id: classroom.id)
          .for_week(week_start)

        next if points.empty?

        positive = points.select { |p| p.point_value > 0 }
        negative = points.select { |p| p.point_value < 0 }

        top_category_id = positive
          .group_by(&:behavior_category_id)
          .max_by { |_, pts| pts.size }
          &.first

        BehaviorSummary.upsert(
          {
            student_id: student.id,
            classroom_id: classroom.id,
            week_start: week_start,
            total_points: points.sum(&:point_value),
            positive_count: positive.size,
            negative_count: negative.size,
            top_behavior_category_id: top_category_id,
            created_at: Time.current,
            updated_at: Time.current
          },
          unique_by: [:student_id, :classroom_id, :week_start]
        )

        # Notify parents
        student.parents.find_each do |parent|
          Notification.create!(
            recipient: parent,
            notifiable: student,
            title: "Weekly Behavior Report",
            body: "#{student.name}'s behavior report for this week is ready.",
            kind: "behavior_report"
          )
        end
      end
    end
  end
end
```

- [ ] **Step 2: Add recurring job configuration**

Add to `backend/config/recurring.yml` (create if not exists):

```yaml
production:
  generate_behavior_summaries:
    class: GenerateBehaviorSummariesJob
    schedule: every hour
```

- [ ] **Step 3: Add "behavior_report" to Notification KINDS**

In `backend/app/models/notification.rb`, add `"behavior_report"` to the `KINDS` array.

- [ ] **Step 4: Add behavior seed data to seeds.rb**

Append to `backend/db/seeds.rb`:

```ruby
# === Behavior Points ===
puts "Seeding behavior categories..."

behavior_categories = [
  { name: "Helping Others", point_value: 3, is_positive: true, icon: "🤝", color: "#059669" },
  { name: "Teamwork", point_value: 2, is_positive: true, icon: "👥", color: "#2563eb" },
  { name: "Leadership", point_value: 5, is_positive: true, icon: "⭐", color: "#7c3aed" },
  { name: "Working Hard", point_value: 2, is_positive: true, icon: "💪", color: "#d97706" },
  { name: "Being Respectful", point_value: 1, is_positive: true, icon: "🙏", color: "#0891b2" },
  { name: "Off-task", point_value: -1, is_positive: false, icon: "📵", color: "#dc2626" },
  { name: "Disruptive", point_value: -2, is_positive: false, icon: "🔊", color: "#b91c1c" },
  { name: "Late", point_value: -1, is_positive: false, icon: "⏰", color: "#9f1239" }
]

categories = behavior_categories.each_with_index.map do |attrs, idx|
  BehaviorCategory.create!(attrs.merge(school: school, position: idx))
end

puts "Seeding behavior points (30 days)..."

positive_cats = categories.select(&:is_positive)
negative_cats = categories.reject(&:is_positive)

Classroom.all.each do |classroom|
  teacher = classroom.teachers.first
  next unless teacher

  classroom.students.each do |student|
    30.times do |day_offset|
      date = (Date.current - day_offset)

      # 2-4 positive points per day
      rand(2..4).times do
        cat = positive_cats.sample
        BehaviorPoint.create!(
          student: student,
          teacher: teacher,
          classroom: classroom,
          behavior_category: cat,
          point_value: cat.point_value,
          awarded_at: date.to_datetime + rand(8..15).hours + rand(0..59).minutes
        )
      end

      # 0-1 negative points per day
      if rand < 0.3
        cat = negative_cats.sample
        BehaviorPoint.create!(
          student: student,
          teacher: teacher,
          classroom: classroom,
          behavior_category: cat,
          point_value: cat.point_value,
          awarded_at: date.to_datetime + rand(8..15).hours + rand(0..59).minutes
        )
      end
    end
  end
end

puts "Behavior points seeded!"
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/jobs/generate_behavior_summaries_job.rb backend/config/recurring.yml backend/app/models/notification.rb backend/db/seeds.rb
git commit -m "feat(behavior): add weekly summary job, recurring config, and seed data"
```

---

## Chunk 3: Frontend Pages

### Task 11: Create GraphQL queries/mutations for frontend

**Files:**
- Create: `front-end/src/lib/api/queries/behavior.ts`

- [ ] **Step 1: Create behavior queries file**

Create `front-end/src/lib/api/queries/behavior.ts`:

```typescript
export const BEHAVIOR_CATEGORIES_QUERY = `
  query BehaviorCategories($schoolId: ID!) {
    behaviorCategories(schoolId: $schoolId) {
      id name description pointValue isPositive icon color position
    }
  }
`;

export const CLASSROOM_BEHAVIOR_TODAY_QUERY = `
  query ClassroomBehaviorToday($classroomId: ID!) {
    classroomBehaviorToday(classroomId: $classroomId) {
      student { id name }
      totalPoints
      positiveCount
      negativeCount
      recentPoints { id pointValue note awardedAt revokable behaviorCategory { name icon color } }
    }
  }
`;

export const STUDENT_BEHAVIOR_HISTORY_QUERY = `
  query StudentBehaviorHistory($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
    studentBehaviorHistory(studentId: $studentId, startDate: $startDate, endDate: $endDate) {
      id pointValue note awardedAt revokedAt revokable
      behaviorCategory { id name icon color pointValue }
      teacher { id name }
    }
  }
`;

export const STUDENT_WEEKLY_REPORT_QUERY = `
  query StudentWeeklyReport($studentId: ID!) {
    studentWeeklyReport(studentId: $studentId) {
      id weekStart totalPoints positiveCount negativeCount
      student { id name }
      topBehaviorCategory { id name icon color }
    }
  }
`;

export const CLASSROOM_BEHAVIOR_SUMMARY_QUERY = `
  query ClassroomBehaviorSummary($classroomId: ID!, $weekStart: ISO8601Date!) {
    classroomBehaviorSummary(classroomId: $classroomId, weekStart: $weekStart) {
      id weekStart totalPoints positiveCount negativeCount
      student { id name }
      topBehaviorCategory { name icon }
    }
  }
`;

export const AWARD_BEHAVIOR_POINT_MUTATION = `
  mutation AwardBehaviorPoint($studentId: ID!, $classroomId: ID!, $behaviorCategoryId: ID!, $note: String) {
    awardBehaviorPoint(studentId: $studentId, classroomId: $classroomId, behaviorCategoryId: $behaviorCategoryId, note: $note) {
      behaviorPoint { id pointValue note awardedAt revokable behaviorCategory { name icon color } }
      dailyTotal
      errors { message path }
    }
  }
`;

export const BATCH_AWARD_MUTATION = `
  mutation BatchAwardBehaviorPoints($studentIds: [ID!]!, $classroomId: ID!, $behaviorCategoryId: ID!) {
    batchAwardBehaviorPoints(studentIds: $studentIds, classroomId: $classroomId, behaviorCategoryId: $behaviorCategoryId) {
      behaviorPoints { id pointValue student { id name } }
      errors { message path }
    }
  }
`;

export const REVOKE_BEHAVIOR_POINT_MUTATION = `
  mutation RevokeBehaviorPoint($id: ID!) {
    revokeBehaviorPoint(id: $id) {
      behaviorPoint { id revokedAt }
      errors { message path }
    }
  }
`;

export const CREATE_BEHAVIOR_CATEGORY_MUTATION = `
  mutation CreateBehaviorCategory($schoolId: ID!, $name: String!, $pointValue: Int!, $icon: String!, $color: String!, $description: String) {
    createBehaviorCategory(schoolId: $schoolId, name: $name, pointValue: $pointValue, icon: $icon, color: $color, description: $description) {
      behaviorCategory { id name description pointValue isPositive icon color position }
      errors { message path }
    }
  }
`;

export const UPDATE_BEHAVIOR_CATEGORY_MUTATION = `
  mutation UpdateBehaviorCategory($id: ID!, $name: String, $pointValue: Int, $icon: String, $color: String, $description: String) {
    updateBehaviorCategory(id: $id, name: $name, pointValue: $pointValue, icon: $icon, color: $color, description: $description) {
      behaviorCategory { id name description pointValue isPositive icon color }
      errors { message path }
    }
  }
`;

export const DELETE_BEHAVIOR_CATEGORY_MUTATION = `
  mutation DeleteBehaviorCategory($id: ID!) {
    deleteBehaviorCategory(id: $id) {
      success
      errors { message path }
    }
  }
`;
```

- [ ] **Step 2: Commit**

```bash
git add front-end/src/lib/api/queries/behavior.ts
git commit -m "feat(behavior): add frontend GraphQL queries and mutations"
```

---

### Task 12: Create teacher classroom behavior page (Grid + Quick Bar)

**Files:**
- Create: `front-end/src/routes/teacher/classrooms/[id]/behavior/+page.svelte`

- [ ] **Step 1: Create the page**

This is the main awarding page. Due to its size, create it with both Grid and Quick Bar modes. The page should:
- Fetch `classroomBehaviorToday` and `behaviorCategories` on load
- Implement Grid Mode: student cards with click → behavior selector popup
- Implement Quick Bar Mode: behavior chips → multi-select students → award all
- Show daily totals per student
- Include "Open Projection" button
- Use existing layout and patterns from `front-end/src/routes/teacher/classrooms/[id]/+page.svelte`

*(Full SvelteKit page component — approximately 250 lines. The implementer should reference the existing classroom page for patterns: `$props()`, `$state`, `$effect`, fetch via `/api/graphql`, Tailwind classes, i18n via `m.*()`.)*

- [ ] **Step 2: Add i18n keys**

Add to `front-end/src/messages/en.json`:
```json
"behavior_title": "Behavior Points",
"behavior_grid_mode": "Grid",
"behavior_quick_mode": "Quick Award",
"behavior_open_projection": "Open Projection",
"behavior_award_success": "Point awarded!",
"behavior_batch_success": "Points awarded to {count} students",
"behavior_revoke_success": "Point revoked",
"behavior_today_total": "Today's Total",
"behavior_positive": "Positive",
"behavior_negative": "Negative",
"behavior_select_behavior": "Select behavior",
"behavior_award_all": "Award All",
"behavior_no_categories": "No behavior categories configured. Ask your school manager to set them up."
```

Add corresponding keys to `front-end/src/messages/id.json` with Indonesian translations.

- [ ] **Step 3: Add behavior nav item to teacher layout**

In `front-end/src/routes/teacher/+layout.svelte`, add to the nav items array:
```javascript
{ label: m.behavior_title(), href: '/teacher/behavior', icon: '⭐' }
```

- [ ] **Step 4: Commit**

```bash
git add front-end/src/routes/teacher/classrooms/\[id\]/behavior/+page.svelte front-end/src/messages/en.json front-end/src/messages/id.json front-end/src/routes/teacher/+layout.svelte
git commit -m "feat(behavior): add teacher classroom behavior page with Grid + Quick Bar modes"
```

---

### Task 13: Create projection display page

**Files:**
- Create: `front-end/src/routes/teacher/classrooms/[id]/behavior/display/+page.svelte`

- [ ] **Step 1: Create the projection display page**

Full-screen, dark gradient background, no navigation. Equal grid of student cards with:
- Avatar placeholder, name, daily point total, progress bar
- Real-time updates via ActionCable subscription to `BehaviorChannel`
- Animation: card glows green/red when point awarded/revoked, number counts up/down
- Auto-reconnect indicator
- Press Escape to exit
- Should reference the ActionCable pattern from `front-end/src/lib/stores/notifications.svelte.ts`

- [ ] **Step 2: Commit**

```bash
git add front-end/src/routes/teacher/classrooms/\[id\]/behavior/display/+page.svelte
git commit -m "feat(behavior): add real-time projection display with ActionCable"
```

---

### Task 14: Create school manager behavior category management page

**Files:**
- Create: `front-end/src/routes/school/behavior/categories/+page.svelte`

- [ ] **Step 1: Create the page**

Category management page with:
- List of all categories (positive section + negative section)
- Each row: icon, name, point value, color swatch, edit/delete buttons
- "Add Category" button → modal/inline form
- Edit inline or modal with name, point value, icon picker, color picker
- Delete with confirmation
- Drag-to-reorder (or up/down arrows for simplicity)

- [ ] **Step 2: Add nav item to school layout**

In `front-end/src/routes/school/+layout.svelte`, add behavior nav item.

- [ ] **Step 3: Commit**

```bash
git add front-end/src/routes/school/behavior/categories/+page.svelte front-end/src/routes/school/+layout.svelte
git commit -m "feat(behavior): add school manager behavior category management page"
```

---

### Task 15: Create school behavior dashboard

**Files:**
- Create: `front-end/src/routes/school/behavior/+page.svelte`

- [ ] **Step 1: Create the page**

School-wide behavior overview with:
- Summary cards: total points this week, most common positive/negative behavior
- Classroom comparison table: classroom name, net points, positive %, teacher
- Sortable columns
- CSV export button

- [ ] **Step 2: Commit**

```bash
git add front-end/src/routes/school/behavior/+page.svelte
git commit -m "feat(behavior): add school behavior dashboard page"
```

---

### Task 16: Create parent child behavior report page

**Files:**
- Create: `front-end/src/routes/parent/children/[id]/behavior/+page.svelte`

- [ ] **Step 1: Create the page**

Weekly behavior report showing:
- Summary card: net points, trend arrow vs last week, positive/negative counts
- Daily bar chart for the week (green for positive days, red for negative)
- Top behaviors list with counts
- Teacher notes section

- [ ] **Step 2: Commit**

```bash
git add front-end/src/routes/parent/children/\[id\]/behavior/+page.svelte
git commit -m "feat(behavior): add parent child behavior report page"
```

---

### Task 17: Create student behavior detail page (teacher view)

**Files:**
- Create: `front-end/src/routes/teacher/students/[id]/behavior/+page.svelte`

- [ ] **Step 1: Create the page**

Individual student behavior history showing:
- Behavior history table: date, behavior, points, note, revoke button (if within 15 min)
- Weekly trend bar chart (positive green, negative red, per day)
- Total points this week vs last week

- [ ] **Step 2: Commit**

```bash
git add front-end/src/routes/teacher/students/\[id\]/behavior/+page.svelte
git commit -m "feat(behavior): add teacher student behavior detail page"
```

---

### Task 18: Final integration test and cleanup

- [ ] **Step 1: Run full backend test suite**

Run: `cd backend && bin/rails test`
Expected: All PASS

- [ ] **Step 2: Run seed data**

Run: `cd backend && bin/rails db:seed`
Expected: Seeds complete without errors

- [ ] **Step 3: Verify frontend builds**

Run: `cd front-end && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Manual smoke test**

1. Login as school manager → go to `/school/behavior/categories` → verify categories display
2. Login as teacher → go to classroom behavior page → award a point → verify it appears
3. Open projection display → verify real-time update
4. Login as parent → verify weekly report page

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(behavior): complete behavior points system — all pages and tests"
```
