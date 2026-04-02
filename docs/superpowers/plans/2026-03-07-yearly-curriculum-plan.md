# Yearly Curriculum Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add academic years, grade levels, and a drag-and-drop yearly curriculum builder so schools can select which subjects/topics from the master curriculum are taught per grade each year.

**Architecture:** New Rails models (AcademicYear, GradeCurriculum, GradeCurriculumItem) + GraphQL queries/mutations + SvelteKit drag-and-drop UI using svelte-dnd-action. Existing Classroom and School models get new grade/grade-range fields.

**Tech Stack:** Rails 8.1.2, GraphQL (graphql-ruby), SvelteKit, svelte-dnd-action, Tailwind CSS v4

---

## Phase 1: Backend — Database & Models

### Task 1: Migration — Add grade fields to School and Classroom

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_add_grade_fields.rb`
- Modify: `backend/app/models/school.rb`
- Modify: `backend/app/models/classroom.rb`
- Test: `backend/test/models/school_test.rb`
- Test: `backend/test/models/classroom_test.rb`

**Step 1: Create migration**

```ruby
# backend/db/migrate/TIMESTAMP_add_grade_fields.rb
class AddGradeFields < ActiveRecord::Migration[8.1]
  def change
    add_column :schools, :min_grade, :integer, default: 1, null: false
    add_column :schools, :max_grade, :integer, default: 6, null: false
    add_column :classrooms, :grade, :integer
  end
end
```

Run: `cd backend && bin/rails db:migrate`

**Step 2: Update School model**

Add to `backend/app/models/school.rb`:
```ruby
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

private

def max_grade_gte_min_grade
  errors.add(:max_grade, "must be >= min_grade") if max_grade && min_grade && max_grade < min_grade
end
```

**Step 3: Update Classroom model**

Add to `backend/app/models/classroom.rb`:
```ruby
validates :grade, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 12 }, allow_nil: true
```

**Step 4: Write tests**

Add to `backend/test/models/school_test.rb`:
```ruby
test "validates min_grade and max_grade range" do
  school = schools(:greenwood)
  school.min_grade = 0
  assert_not school.valid?
  school.min_grade = 1
  school.max_grade = 0
  assert_not school.valid?
end

test "max_grade must be >= min_grade" do
  school = schools(:greenwood)
  school.min_grade = 5
  school.max_grade = 3
  assert_not school.valid?
end

test "grade_display_name returns correct labels" do
  school = schools(:greenwood)
  assert_equal "ELM 1", school.grade_display_name(1)
  assert_equal "ELM 6", school.grade_display_name(6)
  assert_equal "JHS 1", school.grade_display_name(7)
  assert_equal "JHS 3", school.grade_display_name(9)
  assert_equal "SHS 1", school.grade_display_name(10)
  assert_equal "SHS 3", school.grade_display_name(12)
end
```

Run: `cd backend && bin/rails test test/models/school_test.rb test/models/classroom_test.rb`

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add grade fields to School and Classroom models"
```

---

### Task 2: Migration — Create AcademicYear, GradeCurriculum, GradeCurriculumItem tables

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_create_yearly_curriculum_tables.rb`
- Create: `backend/app/models/academic_year.rb`
- Create: `backend/app/models/grade_curriculum.rb`
- Create: `backend/app/models/grade_curriculum_item.rb`
- Test: `backend/test/models/academic_year_test.rb`
- Test: `backend/test/models/grade_curriculum_test.rb`
- Test: `backend/test/models/grade_curriculum_item_test.rb`

**Step 1: Create migration**

```ruby
class CreateYearlyCurriculumTables < ActiveRecord::Migration[8.1]
  def change
    create_table :academic_years do |t|
      t.references :school, null: false, foreign_key: true
      t.string :label, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.boolean :current, default: false, null: false
      t.timestamps
    end
    add_index :academic_years, [:school_id, :label], unique: true

    create_table :grade_curriculums do |t|
      t.references :academic_year, null: false, foreign_key: true
      t.integer :grade, null: false
      t.timestamps
    end
    add_index :grade_curriculums, [:academic_year_id, :grade], unique: true

    create_table :grade_curriculum_items do |t|
      t.references :grade_curriculum, null: false, foreign_key: true
      t.references :subject, null: true, foreign_key: true
      t.references :topic, null: true, foreign_key: true
      t.integer :position, default: 0, null: false
      t.timestamps
    end
    add_index :grade_curriculum_items, [:grade_curriculum_id, :subject_id, :topic_id],
      unique: true, name: "idx_grade_curriculum_items_unique"
  end
end
```

Run: `cd backend && bin/rails db:migrate`

**Step 2: Create AcademicYear model**

```ruby
# backend/app/models/academic_year.rb
class AcademicYear < ApplicationRecord
  belongs_to :school
  has_many :grade_curriculums, dependent: :destroy

  validates :label, presence: true, uniqueness: { scope: :school_id }
  validates :start_date, :end_date, presence: true
  validate :end_date_after_start_date

  scope :current_year, -> { where(current: true) }

  def set_as_current!
    transaction do
      school.academic_years.where(current: true).update_all(current: false)
      update!(current: true)
    end
  end

  private

  def end_date_after_start_date
    errors.add(:end_date, "must be after start date") if end_date && start_date && end_date <= start_date
  end
end
```

**Step 3: Create GradeCurriculum model**

```ruby
# backend/app/models/grade_curriculum.rb
class GradeCurriculum < ApplicationRecord
  belongs_to :academic_year
  has_many :grade_curriculum_items, dependent: :destroy

  validates :grade, presence: true,
    numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 12 },
    uniqueness: { scope: :academic_year_id }

  delegate :school, to: :academic_year
end
```

**Step 4: Create GradeCurriculumItem model**

```ruby
# backend/app/models/grade_curriculum_item.rb
class GradeCurriculumItem < ApplicationRecord
  belongs_to :grade_curriculum
  belongs_to :subject, optional: true
  belongs_to :topic, optional: true

  validates :position, presence: true
  validate :exactly_one_reference

  default_scope { order(:position) }

  def display_name
    if subject
      "#{subject.name} (all topics)"
    elsif topic
      topic.name
    end
  end

  private

  def exactly_one_reference
    if subject_id.blank? && topic_id.blank?
      errors.add(:base, "Must reference either a subject or a topic")
    elsif subject_id.present? && topic_id.present?
      errors.add(:base, "Cannot reference both a subject and a topic")
    end
  end
end
```

**Step 5: Add associations to School**

Add to `backend/app/models/school.rb`:
```ruby
has_many :academic_years, dependent: :destroy
```

**Step 6: Write model tests**

Create `backend/test/models/academic_year_test.rb`:
```ruby
require "test_helper"

class AcademicYearTest < ActiveSupport::TestCase
  setup do
    @school = schools(:greenwood)
    @year = AcademicYear.create!(school: @school, label: "2025/2026", start_date: "2025-07-01", end_date: "2026-06-30")
  end

  test "validates label uniqueness per school" do
    dup = AcademicYear.new(school: @school, label: "2025/2026", start_date: "2025-07-01", end_date: "2026-06-30")
    assert_not dup.valid?
  end

  test "validates end_date after start_date" do
    @year.end_date = "2025-01-01"
    assert_not @year.valid?
  end

  test "set_as_current! unsets other current years" do
    @year.update!(current: true)
    year2 = AcademicYear.create!(school: @school, label: "2026/2027", start_date: "2026-07-01", end_date: "2027-06-30")
    year2.set_as_current!
    assert year2.reload.current?
    assert_not @year.reload.current?
  end
end
```

Create `backend/test/models/grade_curriculum_test.rb`:
```ruby
require "test_helper"

class GradeCurriculumTest < ActiveSupport::TestCase
  setup do
    @school = schools(:greenwood)
    @year = AcademicYear.create!(school: @school, label: "2025/2026", start_date: "2025-07-01", end_date: "2026-06-30")
  end

  test "validates grade uniqueness per academic year" do
    GradeCurriculum.create!(academic_year: @year, grade: 1)
    dup = GradeCurriculum.new(academic_year: @year, grade: 1)
    assert_not dup.valid?
  end

  test "validates grade range 1-12" do
    gc = GradeCurriculum.new(academic_year: @year, grade: 0)
    assert_not gc.valid?
    gc.grade = 13
    assert_not gc.valid?
    gc.grade = 6
    assert gc.valid?
  end
end
```

Create `backend/test/models/grade_curriculum_item_test.rb`:
```ruby
require "test_helper"

class GradeCurriculumItemTest < ActiveSupport::TestCase
  setup do
    @school = schools(:greenwood)
    @year = AcademicYear.create!(school: @school, label: "2025/2026", start_date: "2025-07-01", end_date: "2026-06-30")
    @gc = GradeCurriculum.create!(academic_year: @year, grade: 1)
    @subject = Subject.first || Subject.create!(name: "Math", school: @school)
    @topic = @subject.topics.first || Topic.create!(name: "Numbers", subject: @subject, position: 1)
  end

  test "must reference exactly one of subject or topic" do
    item = GradeCurriculumItem.new(grade_curriculum: @gc, position: 1)
    assert_not item.valid?
    assert_includes item.errors[:base].join, "Must reference"
  end

  test "cannot reference both subject and topic" do
    item = GradeCurriculumItem.new(grade_curriculum: @gc, subject: @subject, topic: @topic, position: 1)
    assert_not item.valid?
    assert_includes item.errors[:base].join, "Cannot reference both"
  end

  test "valid with subject only" do
    item = GradeCurriculumItem.new(grade_curriculum: @gc, subject: @subject, position: 1)
    assert item.valid?
  end

  test "valid with topic only" do
    item = GradeCurriculumItem.new(grade_curriculum: @gc, topic: @topic, position: 1)
    assert item.valid?
  end
end
```

Run: `cd backend && bin/rails test test/models/academic_year_test.rb test/models/grade_curriculum_test.rb test/models/grade_curriculum_item_test.rb`

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: add AcademicYear, GradeCurriculum, GradeCurriculumItem models"
```

---

## Phase 2: Backend — GraphQL API

### Task 3: GraphQL types for yearly curriculum

**Files:**
- Create: `backend/app/graphql/types/academic_year_type.rb`
- Create: `backend/app/graphql/types/grade_curriculum_type.rb`
- Create: `backend/app/graphql/types/grade_curriculum_item_type.rb`
- Modify: `backend/app/graphql/types/school_type.rb` (add min_grade, max_grade, academic_years)
- Modify: `backend/app/graphql/types/classroom_type.rb` (add grade)

**Step 1: Create GraphQL types**

```ruby
# backend/app/graphql/types/academic_year_type.rb
module Types
  class AcademicYearType < Types::BaseObject
    field :id, ID, null: false
    field :label, String, null: false
    field :start_date, GraphQL::Types::ISO8601Date, null: false
    field :end_date, GraphQL::Types::ISO8601Date, null: false
    field :current, Boolean, null: false
    field :grade_curriculums, [Types::GradeCurriculumType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

```ruby
# backend/app/graphql/types/grade_curriculum_type.rb
module Types
  class GradeCurriculumType < Types::BaseObject
    field :id, ID, null: false
    field :grade, Integer, null: false
    field :academic_year, Types::AcademicYearType, null: false
    field :grade_curriculum_items, [Types::GradeCurriculumItemType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

```ruby
# backend/app/graphql/types/grade_curriculum_item_type.rb
module Types
  class GradeCurriculumItemType < Types::BaseObject
    field :id, ID, null: false
    field :subject, Types::SubjectType
    field :topic, Types::TopicType
    field :position, Integer, null: false
    field :display_name, String, null: false
  end
end
```

**Step 2: Update SchoolType and ClassroomType**

Add to `backend/app/graphql/types/school_type.rb`:
```ruby
field :min_grade, Integer, null: false
field :max_grade, Integer, null: false
field :academic_years, [Types::AcademicYearType], null: false
```

Add to `backend/app/graphql/types/classroom_type.rb`:
```ruby
field :grade, Integer
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add GraphQL types for yearly curriculum"
```

---

### Task 4: GraphQL queries and mutations

**Files:**
- Modify: `backend/app/graphql/types/query_type.rb`
- Create: `backend/app/graphql/mutations/create_academic_year.rb`
- Create: `backend/app/graphql/mutations/update_academic_year.rb`
- Create: `backend/app/graphql/mutations/set_current_academic_year.rb`
- Create: `backend/app/graphql/mutations/save_grade_curriculum.rb`
- Create: `backend/app/graphql/types/create_academic_year_input_type.rb`
- Create: `backend/app/graphql/types/update_academic_year_input_type.rb`
- Create: `backend/app/graphql/types/save_grade_curriculum_input_type.rb`
- Create: `backend/app/graphql/types/grade_curriculum_item_input_type.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`
- Create: `backend/app/policies/academic_year_policy.rb`
- Create: `backend/app/policies/grade_curriculum_policy.rb`
- Modify: `backend/config/initializers/role_permissions.rb`

**Step 1: Add permissions**

Add to `backend/config/initializers/role_permissions.rb` in teacher hash:
```ruby
"academic_years" => %w[index show create update],
"grade_curriculums" => %w[index show create update],
```

Add same to school_manager hash. Add to parent hash:
```ruby
"academic_years" => %w[index show],
"grade_curriculums" => %w[index show],
```

**Step 2: Create policies**

```ruby
# backend/app/policies/academic_year_policy.rb
class AcademicYearPolicy < ApplicationPolicy
  def index? = user.has_permission?("academic_years", "index")
  def show? = user.has_permission?("academic_years", "show")
  def create? = user.has_permission?("academic_years", "create")
  def update? = user.has_permission?("academic_years", "update")
end
```

```ruby
# backend/app/policies/grade_curriculum_policy.rb
class GradeCurriculumPolicy < ApplicationPolicy
  def index? = user.has_permission?("grade_curriculums", "index")
  def show? = user.has_permission?("grade_curriculums", "show")
  def create? = user.has_permission?("grade_curriculums", "create")
  def update? = user.has_permission?("grade_curriculums", "update")
end
```

**Step 3: Create input types**

```ruby
# backend/app/graphql/types/create_academic_year_input_type.rb
module Types
  class CreateAcademicYearInputType < Types::BaseInputObject
    argument :school_id, ID, required: true
    argument :label, String, required: true
    argument :start_date, GraphQL::Types::ISO8601Date, required: true
    argument :end_date, GraphQL::Types::ISO8601Date, required: true
    argument :current, Boolean, required: false
  end
end
```

```ruby
# backend/app/graphql/types/update_academic_year_input_type.rb
module Types
  class UpdateAcademicYearInputType < Types::BaseInputObject
    argument :id, ID, required: true
    argument :label, String, required: false
    argument :start_date, GraphQL::Types::ISO8601Date, required: false
    argument :end_date, GraphQL::Types::ISO8601Date, required: false
  end
end
```

```ruby
# backend/app/graphql/types/grade_curriculum_item_input_type.rb
module Types
  class GradeCurriculumItemInputType < Types::BaseInputObject
    argument :subject_id, ID, required: false
    argument :topic_id, ID, required: false
    argument :position, Integer, required: true
  end
end
```

```ruby
# backend/app/graphql/types/save_grade_curriculum_input_type.rb
module Types
  class SaveGradeCurriculumInputType < Types::BaseInputObject
    argument :academic_year_id, ID, required: true
    argument :grade, Integer, required: true
    argument :items, [Types::GradeCurriculumItemInputType], required: true
  end
end
```

**Step 4: Create mutations**

```ruby
# backend/app/graphql/mutations/create_academic_year.rb
module Mutations
  class CreateAcademicYear < BaseMutation
    argument :input, Types::CreateAcademicYearInputType, required: true
    field :academic_year, Types::AcademicYearType
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless AcademicYearPolicy.new(current_user, AcademicYear.new).create?
      year = AcademicYear.new(input.to_h)
      if year.save
        year.set_as_current! if input[:current]
        { academic_year: year, errors: [] }
      else
        { academic_year: nil, errors: year.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } } }
      end
    end
  end
end
```

```ruby
# backend/app/graphql/mutations/update_academic_year.rb
module Mutations
  class UpdateAcademicYear < BaseMutation
    argument :input, Types::UpdateAcademicYearInputType, required: true
    field :academic_year, Types::AcademicYearType
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      authenticate!
      year = AcademicYear.find(input[:id])
      raise Pundit::NotAuthorizedError unless AcademicYearPolicy.new(current_user, year).update?
      attrs = input.to_h.except(:id)
      if year.update(attrs)
        { academic_year: year, errors: [] }
      else
        { academic_year: nil, errors: year.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } } }
      end
    end
  end
end
```

```ruby
# backend/app/graphql/mutations/set_current_academic_year.rb
module Mutations
  class SetCurrentAcademicYear < BaseMutation
    argument :id, ID, required: true
    field :academic_year, Types::AcademicYearType
    field :errors, [Types::UserErrorType], null: false

    def resolve(id:)
      authenticate!
      year = AcademicYear.find(id)
      raise Pundit::NotAuthorizedError unless AcademicYearPolicy.new(current_user, year).update?
      year.set_as_current!
      { academic_year: year, errors: [] }
    end
  end
end
```

```ruby
# backend/app/graphql/mutations/save_grade_curriculum.rb
module Mutations
  class SaveGradeCurriculum < BaseMutation
    argument :input, Types::SaveGradeCurriculumInputType, required: true
    field :grade_curriculum, Types::GradeCurriculumType
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless GradeCurriculumPolicy.new(current_user, GradeCurriculum.new).create?

      academic_year = AcademicYear.find(input[:academic_year_id])
      gc = GradeCurriculum.find_or_initialize_by(academic_year: academic_year, grade: input[:grade])

      GradeCurriculum.transaction do
        gc.save! if gc.new_record?
        gc.grade_curriculum_items.destroy_all

        input[:items].each do |item_input|
          gc.grade_curriculum_items.create!(
            subject_id: item_input[:subject_id],
            topic_id: item_input[:topic_id],
            position: item_input[:position]
          )
        end
      end

      { grade_curriculum: gc.reload, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { grade_curriculum: nil, errors: [{ message: e.message, path: ["base"] }] }
    end
  end
end
```

**Step 5: Add queries to query_type.rb**

Add to `backend/app/graphql/types/query_type.rb`:
```ruby
field :academic_years, [Types::AcademicYearType], null: false do
  argument :school_id, ID, required: true
end

def academic_years(school_id:)
  authenticate!
  raise Pundit::NotAuthorizedError unless AcademicYearPolicy.new(current_user, AcademicYear.new).index?
  School.find(school_id).academic_years.order(start_date: :desc)
end

field :grade_curriculum, Types::GradeCurriculumType do
  argument :academic_year_id, ID, required: true
  argument :grade, Integer, required: true
end

def grade_curriculum(academic_year_id:, grade:)
  authenticate!
  raise Pundit::NotAuthorizedError unless GradeCurriculumPolicy.new(current_user, GradeCurriculum.new).show?
  GradeCurriculum.find_by(academic_year_id: academic_year_id, grade: grade)
end
```

**Step 6: Register mutations in mutation_type.rb**

Add to `backend/app/graphql/types/mutation_type.rb`:
```ruby
field :create_academic_year, mutation: Mutations::CreateAcademicYear
field :update_academic_year, mutation: Mutations::UpdateAcademicYear
field :set_current_academic_year, mutation: Mutations::SetCurrentAcademicYear
field :save_grade_curriculum, mutation: Mutations::SaveGradeCurriculum
```

**Step 7: Run all tests**

Run: `cd backend && bin/rails test`

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: add GraphQL queries and mutations for yearly curriculum"
```

---

### Task 5: Seed data updates

**Files:**
- Modify: `backend/db/seeds.rb` (add grade data, academic year)

**Step 1: Add seed data via rails runner** (don't modify seeds.rb for existing data)

Run a rails runner script to update existing data:
```ruby
# Update school grade range
school = School.first
school.update!(min_grade: 1, max_grade: 6)

# Update classroom grades
Classroom.find_by(name: "Class 1A")&.update!(grade: 1)
Classroom.find_by(name: "Class 1B")&.update!(grade: 1)
Classroom.find_by(name: "Class 2A")&.update!(grade: 2)
Classroom.find_by(name: "Class 2B")&.update!(grade: 2)
Classroom.find_by(name: "Class 3A")&.update!(grade: 3)
Classroom.find_by(name: "Class 3B")&.update!(grade: 3)
Classroom.find_by(name: "Class 4A")&.update!(grade: 4)

# Create academic year
ay = AcademicYear.find_or_create_by!(school: school, label: "2025/2026") do |y|
  y.start_date = "2025-07-01"
  y.end_date = "2026-06-30"
  y.current = true
end
```

**Step 2: Restart Rails server**

Run: `kill $(lsof -ti :3004) 2>/dev/null; sleep 1; cd backend && RAILS_ENV=development bin/rails server -p 3004 -d`

**Step 3: Verify via GraphQL**

Test: `curl -s -X POST http://localhost:3004/graphql -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"query":"{ academicYears(schoolId: \"2\") { id label current startDate endDate } }"}'`

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: seed grade data and academic year"
```

---

## Phase 3: Frontend — Drag & Drop UI

### Task 6: Install svelte-dnd-action and add TypeScript types

**Files:**
- Modify: `front-end/package.json`
- Modify: `front-end/src/lib/api/types.ts`
- Create: `front-end/src/lib/api/queries/yearly-curriculum.ts`

**Step 1: Install svelte-dnd-action**

Run: `cd front-end && npm install svelte-dnd-action`

**Step 2: Add TypeScript types**

Add to `front-end/src/lib/api/types.ts`:
```typescript
export interface AcademicYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface GradeCurriculum {
  id: string;
  grade: number;
  academicYear: AcademicYear;
  gradeCurriculumItems: GradeCurriculumItem[];
}

export interface GradeCurriculumItem {
  id: string;
  subject?: Subject;
  topic?: Topic;
  position: number;
  displayName: string;
}
```

**Step 3: Create GraphQL queries file**

Create `front-end/src/lib/api/queries/yearly-curriculum.ts`:
```typescript
export const ACADEMIC_YEARS_QUERY = `
  query AcademicYears($schoolId: ID!) {
    academicYears(schoolId: $schoolId) {
      id
      label
      startDate
      endDate
      current
    }
  }
`;

export const GRADE_CURRICULUM_QUERY = `
  query GradeCurriculum($academicYearId: ID!, $grade: Int!) {
    gradeCurriculum(academicYearId: $academicYearId, grade: $grade) {
      id
      grade
      gradeCurriculumItems {
        id
        subject { id name description topics { id name } }
        topic { id name subject { id name } }
        position
        displayName
      }
    }
  }
`;

export const SAVE_GRADE_CURRICULUM_MUTATION = `
  mutation SaveGradeCurriculum($input: SaveGradeCurriculumInput!) {
    saveGradeCurriculum(input: $input) {
      gradeCurriculum {
        id
        grade
        gradeCurriculumItems {
          id
          subject { id name }
          topic { id name }
          position
          displayName
        }
      }
      errors { message path }
    }
  }
`;

export const CREATE_ACADEMIC_YEAR_MUTATION = `
  mutation CreateAcademicYear($input: CreateAcademicYearInput!) {
    createAcademicYear(input: $input) {
      academicYear { id label startDate endDate current }
      errors { message path }
    }
  }
`;

export const SET_CURRENT_ACADEMIC_YEAR_MUTATION = `
  mutation SetCurrentAcademicYear($id: ID!) {
    setCurrentAcademicYear(id: $id) {
      academicYear { id label current }
      errors { message path }
    }
  }
`;
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add yearly curriculum types and GraphQL queries"
```

---

### Task 7: Grade display helper

**Files:**
- Create: `front-end/src/lib/utils/grade.ts`

**Step 1: Create grade utility**

```typescript
// front-end/src/lib/utils/grade.ts
export function gradeDisplayName(grade: number): string {
  if (grade >= 1 && grade <= 6) return `ELM ${grade}`;
  if (grade >= 7 && grade <= 9) return `JHS ${grade - 6}`;
  if (grade >= 10 && grade <= 12) return `SHS ${grade - 9}`;
  return `Grade ${grade}`;
}

export function gradeOptions(minGrade: number, maxGrade: number): Array<{ value: number; label: string }> {
  const options = [];
  for (let g = minGrade; g <= maxGrade; g++) {
    options.push({ value: g, label: gradeDisplayName(g) });
  }
  return options;
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add grade display name utility"
```

---

### Task 8: Yearly curriculum page — School Manager

**Files:**
- Create: `front-end/src/routes/school/curriculum/yearly/+page.server.ts`
- Create: `front-end/src/routes/school/curriculum/yearly/+page.svelte`

This is the main drag-and-drop page. The `+page.server.ts` loads academic years, subjects (master), and the current grade curriculum. The `+page.svelte` renders the two-panel DnD UI.

**Step 1: Create page.server.ts**

Loads: academic years, subjects (master), grade curriculum for selected year+grade. Uses form actions for saving.

**Step 2: Create page.svelte with svelte-dnd-action**

Two-panel layout:
- Left: Master curriculum tree (subjects with collapsible topics), items are draggable
- Right: Yearly curriculum drop zone, items are sortable and removable
- Top: Academic year dropdown + grade dropdown
- Bottom: Save button

Use `dndzone` from svelte-dnd-action for both panels. Items dragged from left to right get copied (not moved). Items in right panel are sortable.

**Step 3: Build and test**

Run: `cd front-end && npm run build`

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add yearly curriculum drag-and-drop page (school manager)"
```

---

### Task 9: Yearly curriculum page — Teacher

**Files:**
- Create: `front-end/src/routes/teacher/curriculum/yearly/+page.server.ts`
- Create: `front-end/src/routes/teacher/curriculum/yearly/+page.svelte`

Same UI as school manager but gets schoolId from classrooms. Teacher can manage curriculum for grades they teach.

**Step 1: Create page.server.ts** (similar to school manager but uses classrooms to get schoolId and available grades)

**Step 2: Create page.svelte** (reuse same component pattern as school manager)

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add yearly curriculum page for teachers"
```

---

### Task 10: Yearly curriculum page — Parent (read-only)

**Files:**
- Create: `front-end/src/routes/parent/curriculum/yearly/+page.server.ts`
- Create: `front-end/src/routes/parent/curriculum/yearly/+page.svelte`

Read-only view. Auto-selects grade from child's classroom. No drag, no save.

**Step 1: Create page.server.ts** (loads child's grade, academic year, curriculum)

**Step 2: Create page.svelte** (display-only, no DnD)

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add yearly curriculum read-only view for parents"
```

---

### Task 11: Navigation updates

**Files:**
- Modify: `front-end/src/routes/teacher/+layout.svelte`
- Modify: `front-end/src/routes/school/+layout.svelte`
- Modify: `front-end/src/routes/parent/+layout.svelte`

Add "Yearly" sub-link under Curriculum in each role's sidebar, or add it as a tab on the curriculum page.

**Step 1: Update navigation** — Add link to yearly curriculum page in each role's sidebar

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add yearly curriculum navigation links"
```

---

## Phase 4: Academic Year Settings

### Task 12: Academic year settings page (school manager)

**Files:**
- Create: `front-end/src/routes/school/settings/academic-years/+page.server.ts`
- Create: `front-end/src/routes/school/settings/academic-years/+page.svelte`

Simple CRUD page: list years, create form, set current, edit/delete.

**Step 1: Create page.server.ts and page.svelte**

**Step 2: Add "Settings" nav item to school manager sidebar if not present**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add academic year settings page"
```

---

## Phase 5: Final verification

### Task 13: End-to-end testing and cleanup

**Step 1: Run backend tests**

Run: `cd backend && bin/rails test`

**Step 2: Run frontend build**

Run: `cd front-end && npm run build`

**Step 3: Browser test all pages**

- Login as school manager → Settings → Academic Years → Create year
- School Manager → Curriculum → Yearly → Select year + grade → Drag subjects/topics → Save
- Login as teacher → Curriculum → Yearly → Verify same DnD works
- Login as parent → Curriculum → Yearly → Verify read-only view

**Step 4: Push to main**

```bash
git push origin main
```

**Step 5: Update Outline wiki**

Create document in GrewMe collection documenting the yearly curriculum feature.
