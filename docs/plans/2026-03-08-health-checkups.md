# Health Checkups Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add UKS-style health checkup tracking — teachers record student measurements (weight, height, head circumference), BMI auto-calculates, parents view growth history. COPPA compliant (encrypted notes, audit logged, consent-gated).

**Architecture:** Single `health_checkups` table with belongs_to student + teacher. One GraphQL mutation for teachers to create checkups, one query for both teachers and parents to view history. SvelteKit pages for teacher entry form and parent/teacher viewing.

**Tech Stack:** Rails 8.1.2, GraphQL (graphql-ruby), Active Record Encryption, Minitest, SvelteKit 5, Tailwind CSS

---

### Task 1: Migration + Model

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_create_health_checkups.rb`
- Create: `backend/app/models/health_checkup.rb`
- Modify: `backend/app/models/student.rb` — add `has_many :health_checkups`
- Modify: `backend/app/models/teacher.rb` — add `has_many :health_checkups`
- Create: `backend/test/models/health_checkup_test.rb`
- Create: `backend/test/fixtures/health_checkups.yml`

**Step 1: Generate migration**

Run: `bin/rails generate migration CreateHealthCheckups`

Then edit the migration file:

```ruby
class CreateHealthCheckups < ActiveRecord::Migration[8.1]
  def change
    create_table :health_checkups do |t|
      t.references :student, null: false, foreign_key: true
      t.references :teacher, null: false, foreign_key: true
      t.date :measured_at, null: false
      t.decimal :weight_kg, precision: 5, scale: 2
      t.decimal :height_cm, precision: 5, scale: 1
      t.decimal :head_circumference_cm, precision: 4, scale: 1
      t.decimal :bmi, precision: 4, scale: 1
      t.text :notes
      t.timestamps
    end

    add_index :health_checkups, [:student_id, :measured_at], unique: true
  end
end
```

**Step 2: Run migration**

Run: `bin/rails db:migrate`

**Step 3: Create model**

Create `backend/app/models/health_checkup.rb`:

```ruby
class HealthCheckup < ApplicationRecord
  belongs_to :student
  belongs_to :teacher

  encrypts :notes

  validates :measured_at, presence: true
  validates :weight_kg, numericality: { greater_than: 0 }, allow_nil: true
  validates :height_cm, numericality: { greater_than: 0 }, allow_nil: true
  validates :head_circumference_cm, numericality: { greater_than: 0 }, allow_nil: true
  validates :student_id, uniqueness: { scope: :measured_at, message: "already has a checkup on this date" }

  validate :at_least_one_measurement

  before_save :calculate_bmi

  private

  def calculate_bmi
    if weight_kg.present? && height_cm.present? && height_cm > 0
      height_m = height_cm / BigDecimal("100")
      self.bmi = (weight_kg / (height_m**2)).round(1)
    else
      self.bmi = nil
    end
  end

  def at_least_one_measurement
    if weight_kg.blank? && height_cm.blank? && head_circumference_cm.blank?
      errors.add(:base, "At least one measurement (weight, height, or head circumference) is required")
    end
  end
end
```

**Step 4: Add associations to Student and Teacher**

In `backend/app/models/student.rb`, add after existing `has_many` lines:

```ruby
has_many :health_checkups, dependent: :destroy
```

In `backend/app/models/teacher.rb`, add after existing `has_many` lines:

```ruby
has_many :health_checkups, dependent: :destroy
```

**Step 5: Create fixtures**

Create `backend/test/fixtures/health_checkups.yml`:

```yaml
emma_checkup_jan:
  student: student_emma
  teacher: teacher_alice
  measured_at: "2026-01-15"
  weight_kg: 20.5
  height_cm: 115.0
  head_circumference_cm: 51.0
  bmi: 15.5

emma_checkup_feb:
  student: student_emma
  teacher: teacher_alice
  measured_at: "2026-02-15"
  weight_kg: 21.0
  height_cm: 116.0
  head_circumference_cm: 51.2
  bmi: 15.6

finn_checkup_jan:
  student: student_finn
  teacher: teacher_alice
  measured_at: "2026-01-15"
  weight_kg: 22.0
  height_cm: 118.0
  head_circumference_cm: 52.0
  bmi: 15.8
```

**Step 6: Write tests**

Create `backend/test/models/health_checkup_test.rb`:

```ruby
require "test_helper"

class HealthCheckupTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_emma)
    @teacher = teachers(:teacher_alice)
  end

  test "valid health checkup with all measurements" do
    checkup = HealthCheckup.new(
      student: @student,
      teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: 20.5,
      height_cm: 115.0,
      head_circumference_cm: 51.0
    )
    assert checkup.valid?, checkup.errors.full_messages.join(", ")
  end

  test "valid with only weight" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: 20.5
    )
    assert checkup.valid?
  end

  test "valid with only height" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      height_cm: 115.0
    )
    assert checkup.valid?
  end

  test "invalid without any measurement" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15)
    )
    assert_not checkup.valid?
    assert_includes checkup.errors[:base], "At least one measurement (weight, height, or head circumference) is required"
  end

  test "requires measured_at" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      weight_kg: 20.5
    )
    assert_not checkup.valid?
    assert_includes checkup.errors[:measured_at], "can't be blank"
  end

  test "weight must be positive" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: -1
    )
    assert_not checkup.valid?
    assert_includes checkup.errors[:weight_kg], "must be greater than 0"
  end

  test "height must be positive" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      height_cm: 0
    )
    assert_not checkup.valid?
    assert_includes checkup.errors[:height_cm], "must be greater than 0"
  end

  test "unique per student per date" do
    existing = health_checkups(:emma_checkup_jan)
    duplicate = HealthCheckup.new(
      student: existing.student,
      teacher: @teacher,
      measured_at: existing.measured_at,
      weight_kg: 21.0
    )
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:student_id], "already has a checkup on this date"
  end

  test "calculates BMI from weight and height" do
    checkup = HealthCheckup.create!(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: 20.0,
      height_cm: 100.0
    )
    assert_equal BigDecimal("20.0"), checkup.bmi
  end

  test "BMI is nil when height is missing" do
    checkup = HealthCheckup.create!(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: 20.0
    )
    assert_nil checkup.bmi
  end

  test "BMI is nil when weight is missing" do
    checkup = HealthCheckup.create!(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      height_cm: 100.0
    )
    assert_nil checkup.bmi
  end

  test "belongs to student and teacher" do
    checkup = health_checkups(:emma_checkup_jan)
    assert_equal @student, checkup.student
    assert_equal @teacher, checkup.teacher
  end

  test "encrypts notes" do
    checkup = HealthCheckup.create!(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: 20.0,
      notes: "Looks healthy"
    )
    assert_equal "Looks healthy", checkup.notes
    # Verify encryption is configured (ciphertext differs from plaintext)
    raw = HealthCheckup.connection.select_value(
      "SELECT notes FROM health_checkups WHERE id = #{checkup.id}"
    )
    assert_not_equal "Looks healthy", raw
  end
end
```

**Step 7: Run tests**

Run: `RAILS_ENV=test bin/rails db:test:prepare && bin/rails test test/models/health_checkup_test.rb -v`

Expected: All 13 tests pass.

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: add HealthCheckup model with migration, validations, auto-BMI, and tests"
```

---

### Task 2: GraphQL Type + Mutation + Query

**Files:**
- Create: `backend/app/graphql/types/health_checkup_type.rb`
- Create: `backend/app/graphql/mutations/create_health_checkup.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb` — register mutation
- Modify: `backend/app/graphql/types/query_type.rb` — add `studentHealthCheckups` query
- Create: `backend/test/graphql/mutations/health_checkup_mutations_test.rb`

**Step 1: Create GraphQL type**

Create `backend/app/graphql/types/health_checkup_type.rb`:

```ruby
# frozen_string_literal: true

module Types
  class HealthCheckupType < Types::BaseObject
    field :id, ID, null: false
    field :measured_at, GraphQL::Types::ISO8601Date, null: false
    field :weight_kg, Float
    field :height_cm, Float
    field :head_circumference_cm, Float
    field :bmi, Float
    field :bmi_category, String
    field :notes, String
    field :student, Types::StudentType, null: false
    field :teacher, Types::TeacherType, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def bmi_category
      return nil unless object.bmi

      case object.bmi
      when 0...16 then "severely_underweight"
      when 16...18.5 then "underweight"
      when 18.5...25 then "normal"
      when 25...30 then "overweight"
      else "obese"
      end
    end
  end
end
```

**Step 2: Create mutation**

Create `backend/app/graphql/mutations/create_health_checkup.rb`:

```ruby
# frozen_string_literal: true

module Mutations
  class CreateHealthCheckup < BaseMutation
    argument :student_id, ID, required: true
    argument :measured_at, GraphQL::Types::ISO8601Date, required: true
    argument :weight_kg, Float, required: false
    argument :height_cm, Float, required: false
    argument :head_circumference_cm, Float, required: false
    argument :notes, String, required: false

    field :health_checkup, Types::HealthCheckupType
    field :errors, [Types::UserErrorType], null: false

    def resolve(student_id:, measured_at:, weight_kg: nil, height_cm: nil, head_circumference_cm: nil, notes: nil)
      authenticate!

      unless current_user.is_a?(Teacher)
        raise GraphQL::ExecutionError, "Only teachers can record health checkups"
      end

      student = Student.find(student_id)
      raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?

      checkup = HealthCheckup.new(
        student: student,
        teacher: current_user,
        measured_at: measured_at,
        weight_kg: weight_kg,
        height_cm: height_cm,
        head_circumference_cm: head_circumference_cm,
        notes: notes
      )

      if checkup.save
        AuditLogger.log(
          event_type: :HEALTH_CHECKUP_CREATE,
          action: "create_health_checkup",
          user: current_user,
          resource: checkup,
          request: context[:request]
        )
        { health_checkup: checkup, errors: [] }
      else
        {
          health_checkup: nil,
          errors: checkup.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } }
        }
      end
    end
  end
end
```

**Step 3: Register mutation in MutationType**

In `backend/app/graphql/types/mutation_type.rb`, add:

```ruby
field :create_health_checkup, mutation: Mutations::CreateHealthCheckup
```

**Step 4: Add query to QueryType**

In `backend/app/graphql/types/query_type.rb`, add the query field and resolver:

```ruby
field :student_health_checkups, [Types::HealthCheckupType], null: false,
  description: "Health checkup history for a student" do
  argument :student_id, ID, required: true
  argument :start_date, GraphQL::Types::ISO8601Date, required: false
  argument :end_date, GraphQL::Types::ISO8601Date, required: false
end

def student_health_checkups(student_id:, start_date: nil, end_date: nil)
  authenticate!
  student = Student.find(student_id)

  if current_user.is_a?(Teacher)
    raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?
  elsif current_user.is_a?(Parent)
    unless current_user.children.exists?(id: student.id)
      raise GraphQL::ExecutionError, "Not authorized"
    end
    unless Consent.active.exists?(student: student, parent: current_user)
      raise GraphQL::ExecutionError, "Active consent required to view health data"
    end
  else
    raise GraphQL::ExecutionError, "Not authorized"
  end

  AuditLogger.log(
    event_type: :HEALTH_CHECKUP_VIEW,
    action: "student_health_checkups",
    user: current_user,
    resource: student,
    request: context[:request]
  )

  scope = student.health_checkups.order(measured_at: :desc)
  scope = scope.where("measured_at >= ?", start_date) if start_date
  scope = scope.where("measured_at <= ?", end_date) if end_date
  scope
end
```

**Step 5: Write mutation + query tests**

Create `backend/test/graphql/mutations/health_checkup_mutations_test.rb`:

```ruby
require "test_helper"

class HealthCheckupMutationsTest < ActiveSupport::TestCase
  CREATE_MUTATION = <<~GQL
    mutation CreateHealthCheckup($studentId: ID!, $measuredAt: ISO8601Date!, $weightKg: Float, $heightCm: Float, $headCircumferenceCm: Float, $notes: String) {
      createHealthCheckup(studentId: $studentId, measuredAt: $measuredAt, weightKg: $weightKg, heightCm: $heightCm, headCircumferenceCm: $headCircumferenceCm, notes: $notes) {
        healthCheckup { id measuredAt weightKg heightCm headCircumferenceCm bmi bmiCategory notes }
        errors { message path }
      }
    }
  GQL

  QUERY = <<~GQL
    query StudentHealthCheckups($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
      studentHealthCheckups(studentId: $studentId, startDate: $startDate, endDate: $endDate) {
        id measuredAt weightKg heightCm bmi bmiCategory
      }
    }
  GQL

  setup do
    @teacher = teachers(:teacher_alice)
    @parent = parents(:parent_carol)
    @student = students(:student_emma)
  end

  test "teacher creates health checkup" do
    result = GrewmeSchema.execute(CREATE_MUTATION, variables: {
      studentId: @student.id.to_s,
      measuredAt: "2026-03-15",
      weightKg: 20.5,
      heightCm: 115.0,
      headCircumferenceCm: 51.0,
      notes: "Healthy"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "createHealthCheckup")
    assert_empty data["errors"]
    assert_not_nil data["healthCheckup"]["id"]
    assert_equal 20.5, data["healthCheckup"]["weightKg"]
    assert_not_nil data["healthCheckup"]["bmi"]
  end

  test "parent cannot create health checkup" do
    result = GrewmeSchema.execute(CREATE_MUTATION, variables: {
      studentId: @student.id.to_s,
      measuredAt: "2026-03-15",
      weightKg: 20.5
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].any? { |e| e["message"].include?("Only teachers") }
  end

  test "unauthenticated user cannot create" do
    result = GrewmeSchema.execute(CREATE_MUTATION, variables: {
      studentId: @student.id.to_s,
      measuredAt: "2026-03-15",
      weightKg: 20.5
    }, context: { current_user: nil, request: ActionDispatch::TestRequest.create })

    assert result["errors"].any? { |e| e["message"].include?("Authentication required") }
  end

  test "requires at least one measurement" do
    result = GrewmeSchema.execute(CREATE_MUTATION, variables: {
      studentId: @student.id.to_s,
      measuredAt: "2026-03-15"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "createHealthCheckup")
    assert data["errors"].any? { |e| e["message"].include?("At least one measurement") }
  end

  test "teacher queries student health checkups" do
    result = GrewmeSchema.execute(QUERY, variables: {
      studentId: @student.id.to_s
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    checkups = result.dig("data", "studentHealthCheckups")
    assert checkups.length >= 2  # from fixtures
    assert checkups.first["measuredAt"] >= checkups.last["measuredAt"]  # ordered desc
  end

  test "parent with consent queries health checkups" do
    # Ensure active consent exists
    Consent.create!(
      student: @student,
      parent: @parent,
      parent_email: @parent.email,
      consent_method: "email_plus",
      status: :granted,
      granted_at: Time.current
    )

    result = GrewmeSchema.execute(QUERY, variables: {
      studentId: @student.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    checkups = result.dig("data", "studentHealthCheckups")
    assert_not_nil checkups
    assert checkups.length >= 2
  end

  test "parent without consent is denied" do
    result = GrewmeSchema.execute(QUERY, variables: {
      studentId: @student.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].any? { |e| e["message"].include?("consent") || e["message"].include?("authorized") }
  end

  test "date range filtering works" do
    result = GrewmeSchema.execute(QUERY, variables: {
      studentId: @student.id.to_s,
      startDate: "2026-02-01",
      endDate: "2026-02-28"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    checkups = result.dig("data", "studentHealthCheckups")
    assert checkups.all? { |c| c["measuredAt"] >= "2026-02-01" && c["measuredAt"] <= "2026-02-28" }
  end
end
```

**Step 6: Run tests**

Run: `bin/rails test test/graphql/mutations/health_checkup_mutations_test.rb test/models/health_checkup_test.rb -v`

Expected: All tests pass.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: add health checkup GraphQL mutation, query, type, and tests"
```

---

### Task 3: Frontend — Teacher Health Checkup Form

**Files:**
- Create: `front-end/src/lib/api/queries/health-checkups.ts`
- Create: `front-end/src/routes/teacher/students/[id]/health/+page.server.ts`
- Create: `front-end/src/routes/teacher/students/[id]/health/+page.svelte`

**Step 1: Create GraphQL queries**

Create `front-end/src/lib/api/queries/health-checkups.ts`:

```typescript
export const CREATE_HEALTH_CHECKUP_MUTATION = `
  mutation CreateHealthCheckup($studentId: ID!, $measuredAt: ISO8601Date!, $weightKg: Float, $heightCm: Float, $headCircumferenceCm: Float, $notes: String) {
    createHealthCheckup(studentId: $studentId, measuredAt: $measuredAt, weightKg: $weightKg, heightCm: $heightCm, headCircumferenceCm: $headCircumferenceCm, notes: $notes) {
      healthCheckup {
        id measuredAt weightKg heightCm headCircumferenceCm bmi bmiCategory notes
      }
      errors { message path }
    }
  }
`;

export const STUDENT_HEALTH_CHECKUPS_QUERY = `
  query StudentHealthCheckups($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
    studentHealthCheckups(studentId: $studentId, startDate: $startDate, endDate: $endDate) {
      id
      measuredAt
      weightKg
      heightCm
      headCircumferenceCm
      bmi
      bmiCategory
      notes
      teacher { id name }
      createdAt
    }
  }
`;
```

**Step 2: Create server load + actions**

Create `front-end/src/routes/teacher/students/[id]/health/+page.server.ts`:

```typescript
import { graphql } from '$lib/api/client';
import {
  STUDENT_HEALTH_CHECKUPS_QUERY,
  CREATE_HEALTH_CHECKUP_MUTATION
} from '$lib/api/queries/health-checkups';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('access_token');
  if (!token) return { checkups: [], studentId: params.id };

  try {
    const result = await graphql<any>(STUDENT_HEALTH_CHECKUPS_QUERY, {
      studentId: params.id
    }, token);
    return {
      checkups: result.studentHealthCheckups ?? [],
      studentId: params.id
    };
  } catch {
    return { checkups: [], studentId: params.id };
  }
};

export const actions: Actions = {
  create: async ({ request, cookies, params }) => {
    const token = cookies.get('access_token');
    const data = await request.formData();

    const variables: Record<string, any> = {
      studentId: params.id,
      measuredAt: data.get('measuredAt') as string
    };

    const weightKg = data.get('weightKg');
    if (weightKg && weightKg !== '') variables.weightKg = parseFloat(weightKg as string);

    const heightCm = data.get('heightCm');
    if (heightCm && heightCm !== '') variables.heightCm = parseFloat(heightCm as string);

    const headCircumferenceCm = data.get('headCircumferenceCm');
    if (headCircumferenceCm && headCircumferenceCm !== '') variables.headCircumferenceCm = parseFloat(headCircumferenceCm as string);

    const notes = data.get('notes');
    if (notes && notes !== '') variables.notes = notes as string;

    try {
      const result = await graphql<any>(CREATE_HEALTH_CHECKUP_MUTATION, variables, token);
      if (result.createHealthCheckup.errors?.length > 0) {
        return { error: result.createHealthCheckup.errors[0].message };
      }
      return { success: 'Health checkup recorded successfully.' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
};
```

**Step 3: Create page**

Create `front-end/src/routes/teacher/students/[id]/health/+page.svelte`:

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();
  let showForm = $state(false);
</script>

<svelte:head>
  <title>Health Checkups — GrewMe</title>
</svelte:head>

<div class="max-w-4xl mx-auto py-8 px-4">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-text">Health Checkups</h1>
    <button
      onclick={() => showForm = !showForm}
      class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
    >
      {showForm ? 'Cancel' : '+ New Checkup'}
    </button>
  </div>

  {#if form?.error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{form.error}</div>
  {/if}

  {#if form?.success}
    <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{form.success}</div>
  {/if}

  {#if showForm}
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
      <h2 class="text-lg font-semibold text-text mb-4">Record Measurement</h2>
      <form method="POST" action="?/create" use:enhance={() => {
        return async ({ update }) => {
          await update();
          showForm = false;
        };
      }}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="measuredAt" class="block text-sm font-medium text-text mb-1">Date *</label>
            <input type="date" id="measuredAt" name="measuredAt" required
              value={new Date().toISOString().split('T')[0]}
              class="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label for="weightKg" class="block text-sm font-medium text-text mb-1">Weight (kg)</label>
            <input type="number" id="weightKg" name="weightKg" step="0.01" min="0.1" max="200"
              placeholder="e.g. 20.5"
              class="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label for="heightCm" class="block text-sm font-medium text-text mb-1">Height (cm)</label>
            <input type="number" id="heightCm" name="heightCm" step="0.1" min="1" max="250"
              placeholder="e.g. 115.0"
              class="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label for="headCircumferenceCm" class="block text-sm font-medium text-text mb-1">Head Circumference (cm)</label>
            <input type="number" id="headCircumferenceCm" name="headCircumferenceCm" step="0.1" min="1" max="100"
              placeholder="e.g. 51.0"
              class="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
        <div class="mt-4">
          <label for="notes" class="block text-sm font-medium text-text mb-1">Notes</label>
          <textarea id="notes" name="notes" rows="2" placeholder="Optional observations..."
            class="w-full p-2.5 border border-slate-200 rounded-lg text-sm"></textarea>
        </div>
        <p class="text-xs text-text-muted mt-2">* At least one measurement (weight, height, or head circumference) is required.</p>
        <button type="submit" class="mt-4 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
          Save Checkup
        </button>
      </form>
    </div>
  {/if}

  <!-- History -->
  <div class="bg-surface rounded-xl shadow-sm border border-slate-100 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-100">
      <h2 class="text-lg font-semibold text-text">History</h2>
    </div>
    {#if data.checkups?.length > 0}
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-text-muted">Date</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">Weight (kg)</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">Height (cm)</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">Head (cm)</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">BMI</th>
              <th class="px-4 py-3 text-left font-medium text-text-muted">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each data.checkups as checkup}
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 text-text">{new Date(checkup.measuredAt).toLocaleDateString()}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.weightKg ?? '—'}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.heightCm ?? '—'}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.headCircumferenceCm ?? '—'}</td>
                <td class="px-4 py-3 text-right">
                  {#if checkup.bmi}
                    <span class="font-medium">{checkup.bmi}</span>
                    <span class="text-xs text-text-muted ml-1">
                      {checkup.bmiCategory === 'normal' ? '' :
                       checkup.bmiCategory === 'underweight' ? '(low)' :
                       checkup.bmiCategory === 'severely_underweight' ? '(very low)' :
                       checkup.bmiCategory === 'overweight' ? '(high)' : '(very high)'}
                    </span>
                  {:else}
                    —
                  {/if}
                </td>
                <td class="px-4 py-3 text-text-muted text-xs">{checkup.notes ?? ''}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="px-6 py-12 text-center text-text-muted">
        <p>No health checkups recorded yet.</p>
        <p class="text-sm mt-1">Click "+ New Checkup" to record the first measurement.</p>
      </div>
    {/if}
  </div>
</div>
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add teacher health checkup form and history page"
```

---

### Task 4: Frontend — Parent Health View

**Files:**
- Create: `front-end/src/routes/parent/children/[id]/health/+page.server.ts`
- Create: `front-end/src/routes/parent/children/[id]/health/+page.svelte`

**Step 1: Create server load**

Create `front-end/src/routes/parent/children/[id]/health/+page.server.ts`:

```typescript
import { graphql } from '$lib/api/client';
import { STUDENT_HEALTH_CHECKUPS_QUERY } from '$lib/api/queries/health-checkups';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('access_token');
  if (!token) return { checkups: [], studentId: params.id };

  try {
    const result = await graphql<any>(STUDENT_HEALTH_CHECKUPS_QUERY, {
      studentId: params.id
    }, token);
    return {
      checkups: result.studentHealthCheckups ?? [],
      studentId: params.id
    };
  } catch (e) {
    return { checkups: [], studentId: params.id, error: (e as Error).message };
  }
};
```

**Step 2: Create page**

Create `front-end/src/routes/parent/children/[id]/health/+page.svelte`:

```svelte
<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>Health History — GrewMe</title>
</svelte:head>

<div class="max-w-4xl mx-auto py-8 px-4">
  <h1 class="text-2xl font-bold text-text mb-6">Health History</h1>

  {#if data.error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{data.error}</div>
  {/if}

  {#if data.checkups?.length > 0}
    <!-- Growth Summary -->
    {@const latest = data.checkups[0]}
    {@const earliest = data.checkups[data.checkups.length - 1]}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">Latest Weight</p>
        <p class="text-2xl font-bold text-text mt-1">{latest.weightKg ?? '—'}<span class="text-sm font-normal text-text-muted"> kg</span></p>
      </div>
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">Latest Height</p>
        <p class="text-2xl font-bold text-text mt-1">{latest.heightCm ?? '—'}<span class="text-sm font-normal text-text-muted"> cm</span></p>
      </div>
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">BMI</p>
        <p class="text-2xl font-bold text-text mt-1">{latest.bmi ?? '—'}</p>
        {#if latest.bmiCategory && latest.bmiCategory !== 'normal'}
          <p class="text-xs text-amber-600 mt-0.5">{latest.bmiCategory.replace('_', ' ')}</p>
        {:else if latest.bmiCategory === 'normal'}
          <p class="text-xs text-green-600 mt-0.5">normal</p>
        {/if}
      </div>
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">Checkups</p>
        <p class="text-2xl font-bold text-text mt-1">{data.checkups.length}</p>
      </div>
    </div>

    <!-- History Table -->
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100">
        <h2 class="text-lg font-semibold text-text">All Measurements</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-text-muted">Date</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">Weight (kg)</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">Height (cm)</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">Head (cm)</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">BMI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each data.checkups as checkup}
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 text-text">{new Date(checkup.measuredAt).toLocaleDateString()}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.weightKg ?? '—'}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.heightCm ?? '—'}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.headCircumferenceCm ?? '—'}</td>
                <td class="px-4 py-3 text-right font-medium text-text">{checkup.bmi ?? '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 px-6 py-12 text-center">
      <p class="text-text-muted">No health checkups recorded yet.</p>
      <p class="text-sm text-text-muted mt-1">Your child's teacher will record measurements during school health checks.</p>
    </div>
  {/if}
</div>
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add parent health checkup history view"
```

---

### Task 5: Run Full Test Suite + Push

**Step 1: Run full test suite**

Run: `RAILS_ENV=test bin/rails test -v`

Expected: All tests pass (454 existing + ~21 new = ~475 total), 0 failures, 0 errors.

**Step 2: Commit any fixes if needed**

**Step 3: Push to origin**

```bash
git push origin main
```

**Step 4: Save to Outline**

Create Outline document: "Feat: Health Checkups / UKS Growth Monitoring" in GrewMe collection.
