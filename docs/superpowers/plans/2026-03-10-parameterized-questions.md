# Parameterized Exam Questions — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable exam questions to use templates with variables so each student gets unique values while testing the same concept. Auto-calculate correct answers via safe formula evaluation.

**Architecture:** Add `dentaku` gem for safe formula evaluation. Extend `exam_questions` with parameterized fields. New `question_templates` table for pre-built library. New `student_questions` table for per-student instances. Generation happens when exam is assigned to classroom. Auto-grading uses per-student correct answers.

**Tech Stack:** Rails 8.1, Dentaku gem, PostgreSQL jsonb, SvelteKit frontend

---

## Phase 1: Backend — Database & Models

### Task 1: Add Dentaku gem

**Files:**
- Modify: `backend/Gemfile`

**Step 1: Add dentaku to Gemfile**

Add after the last gem in the main group:

```ruby
gem "dentaku", "~> 3.5"
```

**Step 2: Bundle install**

Run: `cd backend && bundle install`
Expected: Dentaku installed successfully

**Step 3: Commit**

```bash
git add backend/Gemfile backend/Gemfile.lock
git commit -m "chore: add dentaku gem for safe formula evaluation"
```

---

### Task 2: Migration — Extend exam_questions + create new tables

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_add_parameterized_questions.rb`

**Step 1: Generate migration**

Run: `cd backend && bin/rails generate migration AddParameterizedQuestions`

**Step 2: Write the migration**

```ruby
class AddParameterizedQuestions < ActiveRecord::Migration[8.1]
  def change
    # Extend exam_questions with parameterized fields
    add_column :exam_questions, :parameterized, :boolean, default: false, null: false
    add_column :exam_questions, :template_text, :string
    add_column :exam_questions, :variables, :jsonb, default: []
    add_column :exam_questions, :formula, :string
    add_column :exam_questions, :value_mode, :integer, default: 0  # 0=fixed, 1=shuffled
    add_column :exam_questions, :fixed_values, :jsonb, default: {}

    # Relax NOT NULL on question_text and correct_answer for parameterized questions
    change_column_null :exam_questions, :question_text, true
    change_column_null :exam_questions, :correct_answer, true

    # Pre-built question template library
    create_table :question_templates do |t|
      t.string :name, null: false
      t.string :category, null: false
      t.integer :grade_min, null: false, default: 1
      t.integer :grade_max, null: false, default: 12
      t.string :template_text, null: false
      t.jsonb :variables, null: false, default: []
      t.string :formula, null: false
      t.timestamps
    end

    add_index :question_templates, :category
    add_index :question_templates, [:grade_min, :grade_max]

    # Per-student question instances
    create_table :student_questions do |t|
      t.references :exam_question, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: true
      t.references :classroom_exam, null: false, foreign_key: true
      t.jsonb :values, null: false, default: {}
      t.string :generated_text, null: false
      t.string :correct_answer, null: false
      t.timestamps
    end

    add_index :student_questions,
              [:exam_question_id, :student_id, :classroom_exam_id],
              unique: true,
              name: "idx_student_questions_unique"

    # Link exam_answers to student_questions (optional, for parameterized)
    add_reference :exam_answers, :student_question, foreign_key: true, null: true
  end
end
```

**Step 3: Run migration**

Run: `cd backend && bin/rails db:migrate`
Expected: Migration succeeds, schema updated

**Step 4: Commit**

```bash
git add backend/db/
git commit -m "feat: add parameterized questions schema (exam_questions, question_templates, student_questions)"
```

---

### Task 3: QuestionTemplate model + seed data

**Files:**
- Create: `backend/app/models/question_template.rb`
- Create: `backend/test/models/question_template_test.rb`
- Create: `backend/test/fixtures/question_templates.yml`
- Create: `backend/db/seeds/question_templates.rb`

**Step 1: Write the failing test**

Create `backend/test/models/question_template_test.rb`:

```ruby
require "test_helper"

class QuestionTemplateTest < ActiveSupport::TestCase
  test "validates name presence" do
    t = QuestionTemplate.new(category: "arithmetic", template_text: "{a} + {b}", formula: "a + b")
    assert_not t.valid?
    assert_includes t.errors[:name], "can't be blank"
  end

  test "validates category presence" do
    t = QuestionTemplate.new(name: "Addition", template_text: "{a} + {b}", formula: "a + b")
    assert_not t.valid?
    assert_includes t.errors[:category], "can't be blank"
  end

  test "validates template_text presence" do
    t = QuestionTemplate.new(name: "Addition", category: "arithmetic", formula: "a + b")
    assert_not t.valid?
    assert_includes t.errors[:template_text], "can't be blank"
  end

  test "validates formula presence" do
    t = QuestionTemplate.new(name: "Addition", category: "arithmetic", template_text: "{a} + {b}")
    assert_not t.valid?
    assert_includes t.errors[:formula], "can't be blank"
  end

  test "valid template saves" do
    t = QuestionTemplate.new(
      name: "Addition",
      category: "arithmetic",
      template_text: "What is {a} + {b}?",
      variables: [{ "name" => "a", "min" => 1, "max" => 100 }, { "name" => "b", "min" => 1, "max" => 100 }],
      formula: "a + b",
      grade_min: 1,
      grade_max: 6
    )
    assert t.valid?
  end

  test "scopes by category" do
    assert QuestionTemplate.by_category("arithmetic").count >= 0
  end

  test "scopes by grade" do
    assert QuestionTemplate.for_grade(3).count >= 0
  end
end
```

**Step 2: Run test to verify it fails**

Run: `cd backend && bin/rails test test/models/question_template_test.rb`
Expected: FAIL (uninitialized constant QuestionTemplate)

**Step 3: Create model**

Create `backend/app/models/question_template.rb`:

```ruby
class QuestionTemplate < ApplicationRecord
  validates :name, presence: true
  validates :category, presence: true
  validates :template_text, presence: true
  validates :formula, presence: true
  validates :grade_min, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :grade_max, numericality: { only_integer: true, less_than_or_equal_to: 12 }

  scope :by_category, ->(cat) { where(category: cat) }
  scope :for_grade, ->(grade) { where("grade_min <= ? AND grade_max >= ?", grade, grade) }
end
```

**Step 4: Create fixture**

Create `backend/test/fixtures/question_templates.yml`:

```yaml
addition:
  name: "Addition"
  category: "arithmetic"
  grade_min: 1
  grade_max: 6
  template_text: "What is {a} + {b}?"
  variables:
    - name: "a"
      min: 1
      max: 100
    - name: "b"
      min: 1
      max: 100
  formula: "a + b"

rectangle_area:
  name: "Rectangle Area"
  category: "geometry"
  grade_min: 3
  grade_max: 9
  template_text: "Calculate the area of a rectangle with width {width} and height {height}."
  variables:
    - name: "width"
      min: 1
      max: 50
    - name: "height"
      min: 1
      max: 50
  formula: "width * height"
```

**Step 5: Run tests**

Run: `cd backend && bin/rails test test/models/question_template_test.rb`
Expected: All PASS

**Step 6: Create seed file**

Create `backend/db/seeds/question_templates.rb`:

```ruby
# Parameterized question template library
templates = [
  # Arithmetic (Grade 1-6)
  { name: "Addition", category: "arithmetic", grade_min: 1, grade_max: 6,
    template_text: "What is {a} + {b}?",
    variables: [{ name: "a", min: 1, max: 100 }, { name: "b", min: 1, max: 100 }],
    formula: "a + b" },
  { name: "Subtraction", category: "arithmetic", grade_min: 1, grade_max: 6,
    template_text: "What is {a} - {b}?",
    variables: [{ name: "a", min: 10, max: 100 }, { name: "b", min: 1, max: 50 }],
    formula: "a - b" },
  { name: "Multiplication", category: "arithmetic", grade_min: 2, grade_max: 6,
    template_text: "What is {a} × {b}?",
    variables: [{ name: "a", min: 1, max: 12 }, { name: "b", min: 1, max: 12 }],
    formula: "a * b" },
  { name: "Division", category: "arithmetic", grade_min: 2, grade_max: 6,
    template_text: "What is {dividend} ÷ {divisor}?",
    variables: [{ name: "divisor", min: 1, max: 12 }, { name: "dividend", min: 1, max: 144 }],
    formula: "dividend / divisor" },

  # Geometry (Grade 3-9)
  { name: "Rectangle Area", category: "geometry", grade_min: 3, grade_max: 9,
    template_text: "Calculate the area of a rectangle with width {width} and height {height}.",
    variables: [{ name: "width", min: 1, max: 50 }, { name: "height", min: 1, max: 50 }],
    formula: "width * height" },
  { name: "Rectangle Perimeter", category: "geometry", grade_min: 3, grade_max: 9,
    template_text: "Calculate the perimeter of a rectangle with width {width} and height {height}.",
    variables: [{ name: "width", min: 1, max: 50 }, { name: "height", min: 1, max: 50 }],
    formula: "2 * (width + height)" },
  { name: "Triangle Area", category: "geometry", grade_min: 3, grade_max: 9,
    template_text: "Calculate the area of a triangle with base {base} and height {height}.",
    variables: [{ name: "base", min: 2, max: 40 }, { name: "height", min: 2, max: 40 }],
    formula: "base * height / 2" },

  # Percentages (Grade 5-9)
  { name: "Percentage of Number", category: "percentage", grade_min: 5, grade_max: 9,
    template_text: "What is {percent}% of {number}?",
    variables: [{ name: "percent", min: 5, max: 95 }, { name: "number", min: 10, max: 500 }],
    formula: "percent * number / 100" },

  # Algebra (Grade 6-9)
  { name: "Simple Linear Equation", category: "algebra", grade_min: 6, grade_max: 9,
    template_text: "Solve for x: {a}x + {b} = {c}",
    variables: [{ name: "a", min: 1, max: 10 }, { name: "b", min: 1, max: 20 }, { name: "c", min: 5, max: 50 }],
    formula: "(c - b) / a" },

  # Volume (Grade 5-9)
  { name: "Rectangular Prism Volume", category: "volume", grade_min: 5, grade_max: 9,
    template_text: "Calculate the volume of a rectangular prism with length {length}, width {width}, and height {height}.",
    variables: [{ name: "length", min: 1, max: 20 }, { name: "width", min: 1, max: 20 }, { name: "height", min: 1, max: 20 }],
    formula: "length * width * height" },
]

templates.each do |attrs|
  QuestionTemplate.find_or_create_by!(name: attrs[:name]) do |t|
    t.assign_attributes(attrs)
  end
end

puts "Seeded #{QuestionTemplate.count} question templates"
```

**Step 7: Commit**

```bash
git add backend/app/models/question_template.rb backend/test/ backend/db/seeds/
git commit -m "feat: QuestionTemplate model with seed data (11 pre-built templates)"
```

---

### Task 4: StudentQuestion model

**Files:**
- Create: `backend/app/models/student_question.rb`
- Create: `backend/test/models/student_question_test.rb`
- Create: `backend/test/fixtures/student_questions.yml`

**Step 1: Write the failing test**

Create `backend/test/models/student_question_test.rb`:

```ruby
require "test_helper"

class StudentQuestionTest < ActiveSupport::TestCase
  test "validates uniqueness of exam_question per student per classroom_exam" do
    existing = student_questions(:wyatt_q1)
    dup = StudentQuestion.new(
      exam_question: existing.exam_question,
      student: existing.student,
      classroom_exam: existing.classroom_exam,
      values: { "a" => 5, "b" => 3 },
      generated_text: "What is 5 + 3?",
      correct_answer: "8"
    )
    assert_not dup.valid?
  end

  test "belongs to exam_question" do
    sq = student_questions(:wyatt_q1)
    assert_kind_of ExamQuestion, sq.exam_question
  end

  test "belongs to student" do
    sq = student_questions(:wyatt_q1)
    assert_kind_of Student, sq.student
  end

  test "belongs to classroom_exam" do
    sq = student_questions(:wyatt_q1)
    assert_kind_of ClassroomExam, sq.classroom_exam
  end

  test "validates generated_text presence" do
    sq = StudentQuestion.new(correct_answer: "8")
    assert_not sq.valid?
    assert_includes sq.errors[:generated_text], "can't be blank"
  end

  test "validates correct_answer presence" do
    sq = StudentQuestion.new(generated_text: "What is 5 + 3?")
    assert_not sq.valid?
    assert_includes sq.errors[:correct_answer], "can't be blank"
  end
end
```

**Step 2: Run test to verify it fails**

Run: `cd backend && bin/rails test test/models/student_question_test.rb`
Expected: FAIL (uninitialized constant StudentQuestion)

**Step 3: Create model**

Create `backend/app/models/student_question.rb`:

```ruby
class StudentQuestion < ApplicationRecord
  belongs_to :exam_question
  belongs_to :student
  belongs_to :classroom_exam

  validates :generated_text, presence: true
  validates :correct_answer, presence: true
  validates :exam_question_id, uniqueness: { scope: [:student_id, :classroom_exam_id] }
end
```

**Step 4: Create fixture**

Create `backend/test/fixtures/student_questions.yml`:

```yaml
wyatt_q1:
  exam_question: mc_q1
  student: student_wyatt
  classroom_exam: grade3_fractions_mc
  values:
    a: 10
    b: 7
  generated_text: "What is 10 + 7?"
  correct_answer: "17"
```

**Step 5: Update related models**

Modify `backend/app/models/exam_question.rb`:

```ruby
class ExamQuestion < ApplicationRecord
  belongs_to :exam

  has_many :student_questions, dependent: :destroy

  enum :value_mode, { fixed: 0, shuffled: 1 }

  validates :question_text, presence: true, unless: :parameterized?
  validates :correct_answer, presence: true, unless: :parameterized?
  validates :template_text, presence: true, if: :parameterized?
  validates :formula, presence: true, if: :parameterized?
  validates :points, numericality: { only_integer: true, greater_than: 0 }

  default_scope { order(:position) }
end
```

Modify `backend/app/models/exam_answer.rb`:

```ruby
class ExamAnswer < ApplicationRecord
  belongs_to :exam_submission
  belongs_to :exam_question
  belongs_to :student_question, optional: true

  validates :exam_question_id, uniqueness: { scope: :exam_submission_id }
end
```

Modify `backend/app/models/classroom_exam.rb` — add `has_many :student_questions`:

```ruby
class ClassroomExam < ApplicationRecord
  belongs_to :exam
  belongs_to :classroom
  belongs_to :assigned_by, polymorphic: true

  has_many :exam_submissions, dependent: :destroy
  has_many :student_questions, dependent: :destroy

  enum :status, { draft: 0, active: 1, closed: 2 }

  validates :exam_id, uniqueness: { scope: :classroom_id }

  scope :upcoming, -> { where("scheduled_at > ?", Time.current) }
  scope :active_exams, -> { active.where("due_at IS NULL OR due_at > ?", Time.current) }
end
```

**Step 6: Run tests**

Run: `cd backend && bin/rails test test/models/student_question_test.rb test/models/exam_question_test.rb`
Expected: All PASS

**Step 7: Commit**

```bash
git add backend/app/models/ backend/test/
git commit -m "feat: StudentQuestion model + update ExamQuestion with parameterized fields"
```

---

### Task 5: FormulaEvaluator service

**Files:**
- Create: `backend/app/services/formula_evaluator.rb`
- Create: `backend/test/services/formula_evaluator_test.rb`

**Step 1: Write the failing test**

Create `backend/test/services/formula_evaluator_test.rb`:

```ruby
require "test_helper"

class FormulaEvaluatorTest < ActiveSupport::TestCase
  test "evaluates simple addition" do
    result = FormulaEvaluator.evaluate("a + b", { "a" => 10, "b" => 7 })
    assert_equal 17, result
  end

  test "evaluates multiplication" do
    result = FormulaEvaluator.evaluate("width * height", { "width" => 5, "height" => 8 })
    assert_equal 40, result
  end

  test "evaluates complex formula" do
    result = FormulaEvaluator.evaluate("2 * (width + height)", { "width" => 5, "height" => 8 })
    assert_equal 26, result
  end

  test "evaluates division" do
    result = FormulaEvaluator.evaluate("dividend / divisor", { "dividend" => 24, "divisor" => 6 })
    assert_equal 4, result
  end

  test "evaluates triangle area with decimal result" do
    result = FormulaEvaluator.evaluate("base * height / 2", { "base" => 7, "height" => 5 })
    assert_equal 17.5, result
  end

  test "evaluates linear equation solution" do
    result = FormulaEvaluator.evaluate("(c - b) / a", { "a" => 3, "b" => 5, "c" => 20 })
    assert_equal 5, result
  end

  test "returns nil for invalid formula" do
    result = FormulaEvaluator.evaluate("invalid!!!", { "a" => 1 })
    assert_nil result
  end

  test "formats result as string" do
    result = FormulaEvaluator.evaluate_to_s("a + b", { "a" => 10, "b" => 7 })
    assert_equal "17", result
  end

  test "formats decimal result without trailing zeros" do
    result = FormulaEvaluator.evaluate_to_s("base * height / 2", { "base" => 7, "height" => 5 })
    assert_equal "17.5", result
  end

  test "formats integer result without decimal" do
    result = FormulaEvaluator.evaluate_to_s("a * b", { "a" => 3, "b" => 4 })
    assert_equal "12", result
  end
end
```

**Step 2: Run test to verify it fails**

Run: `cd backend && bin/rails test test/services/formula_evaluator_test.rb`
Expected: FAIL (uninitialized constant FormulaEvaluator)

**Step 3: Create service**

Create `backend/app/services/formula_evaluator.rb`:

```ruby
class FormulaEvaluator
  def self.evaluate(formula, variables)
    calculator = Dentaku::Calculator.new
    # Convert string keys to symbols for Dentaku
    vars = variables.transform_keys(&:to_sym).transform_values(&:to_f)
    result = calculator.evaluate(formula, vars)
    result
  rescue Dentaku::ParseError, Dentaku::UnboundVariableError, ZeroDivisionError => e
    Rails.logger.warn("FormulaEvaluator error: #{e.message} for formula='#{formula}' vars=#{variables}")
    nil
  end

  def self.evaluate_to_s(formula, variables)
    result = evaluate(formula, variables)
    return nil if result.nil?

    # Format: remove trailing zeros (17.0 -> "17", 17.5 -> "17.5")
    result == result.to_i ? result.to_i.to_s : result.to_s
  end
end
```

**Step 4: Run tests**

Run: `cd backend && bin/rails test test/services/formula_evaluator_test.rb`
Expected: All PASS

**Step 5: Commit**

```bash
git add backend/app/services/formula_evaluator.rb backend/test/services/
git commit -m "feat: FormulaEvaluator service using Dentaku for safe math evaluation"
```

---

### Task 6: QuestionGenerator service

**Files:**
- Create: `backend/app/services/question_generator.rb`
- Create: `backend/test/services/question_generator_test.rb`

**Step 1: Write the failing test**

Create `backend/test/services/question_generator_test.rb`:

```ruby
require "test_helper"

class QuestionGeneratorTest < ActiveSupport::TestCase
  test "renders template text with values" do
    text = QuestionGenerator.render_text("What is {a} + {b}?", { "a" => 10, "b" => 7 })
    assert_equal "What is 10 + 7?", text
  end

  test "generates random values within ranges" do
    variables = [
      { "name" => "a", "min" => 1, "max" => 10 },
      { "name" => "b", "min" => 1, "max" => 10 }
    ]
    values = QuestionGenerator.random_values(variables)
    assert values["a"].between?(1, 10)
    assert values["b"].between?(1, 10)
  end

  test "generates unique value sets" do
    variables = [
      { "name" => "a", "min" => 1, "max" => 100 },
      { "name" => "b", "min" => 1, "max" => 100 }
    ]
    sets = QuestionGenerator.unique_value_sets(variables, 5)
    assert_equal 5, sets.length
    assert_equal 5, sets.uniq.length
  end

  test "generates student questions for classroom exam" do
    exam_question = exam_questions(:mc_q1)
    # Make it parameterized for the test
    exam_question.update_columns(
      parameterized: true,
      template_text: "What is {a} + {b}?",
      variables: [{ "name" => "a", "min" => 1, "max" => 50 }, { "name" => "b", "min" => 1, "max" => 50 }],
      formula: "a + b",
      value_mode: 1 # shuffled
    )

    classroom_exam = classroom_exams(:grade3_fractions_mc)
    students = classroom_exam.classroom.students

    # Clear any existing student questions
    StudentQuestion.where(exam_question: exam_question, classroom_exam: classroom_exam).delete_all

    QuestionGenerator.generate_for_classroom_exam!(classroom_exam)

    student_questions = StudentQuestion.where(exam_question: exam_question, classroom_exam: classroom_exam)
    assert_equal students.count, student_questions.count

    # Verify uniqueness
    value_combos = student_questions.pluck(:values)
    assert_equal value_combos.length, value_combos.uniq.length

    # Verify correct answers are computed
    student_questions.each do |sq|
      expected = FormulaEvaluator.evaluate_to_s("a + b", sq.values)
      assert_equal expected, sq.correct_answer
    end
  end

  test "generates fixed student questions for all students" do
    exam_question = exam_questions(:mc_q1)
    exam_question.update_columns(
      parameterized: true,
      template_text: "What is {a} + {b}?",
      variables: [{ "name" => "a", "min" => 1, "max" => 50 }, { "name" => "b", "min" => 1, "max" => 50 }],
      formula: "a + b",
      value_mode: 0, # fixed
      fixed_values: { "a" => 10, "b" => 7 }
    )

    classroom_exam = classroom_exams(:grade3_fractions_mc)
    students = classroom_exam.classroom.students

    StudentQuestion.where(exam_question: exam_question, classroom_exam: classroom_exam).delete_all

    QuestionGenerator.generate_for_classroom_exam!(classroom_exam)

    student_questions = StudentQuestion.where(exam_question: exam_question, classroom_exam: classroom_exam)

    # All students get same values
    student_questions.each do |sq|
      assert_equal({ "a" => 10, "b" => 7 }, sq.values)
      assert_equal "What is 10 + 7?", sq.generated_text
      assert_equal "17", sq.correct_answer
    end
  end

  test "calculates total possible combinations" do
    variables = [
      { "name" => "a", "min" => 1, "max" => 10 },
      { "name" => "b", "min" => 1, "max" => 5 }
    ]
    combos = QuestionGenerator.total_combinations(variables)
    assert_equal 50, combos  # 10 * 5
  end
end
```

**Step 2: Run test to verify it fails**

Run: `cd backend && bin/rails test test/services/question_generator_test.rb`
Expected: FAIL (uninitialized constant QuestionGenerator)

**Step 3: Create service**

Create `backend/app/services/question_generator.rb`:

```ruby
class QuestionGenerator
  MAX_UNIQUENESS_ATTEMPTS = 1000

  # Render template text by substituting {variable} placeholders with values
  def self.render_text(template_text, values)
    text = template_text.dup
    values.each do |key, val|
      formatted = val.is_a?(Float) && val == val.to_i ? val.to_i.to_s : val.to_s
      text.gsub!("{#{key}}", formatted)
    end
    text
  end

  # Generate random integer values within variable ranges
  def self.random_values(variables)
    variables.each_with_object({}) do |var, hash|
      hash[var["name"]] = rand(var["min"]..var["max"])
    end
  end

  # Generate N unique value sets
  def self.unique_value_sets(variables, count)
    sets = Set.new
    attempts = 0

    while sets.size < count && attempts < MAX_UNIQUENESS_ATTEMPTS
      vals = random_values(variables)
      sets.add(vals)
      attempts += 1
    end

    # If we can't get enough unique sets, fill with random (may overlap)
    while sets.size < count
      sets.add(random_values(variables))
    end

    sets.to_a
  end

  # Calculate total possible combinations for uniqueness check
  def self.total_combinations(variables)
    variables.reduce(1) { |prod, var| prod * (var["max"] - var["min"] + 1) }
  end

  # Generate StudentQuestion records for all parameterized questions in a classroom exam
  def self.generate_for_classroom_exam!(classroom_exam)
    exam = classroom_exam.exam
    students = classroom_exam.classroom.students.to_a
    return if students.empty?

    parameterized_questions = exam.exam_questions.where(parameterized: true)
    return if parameterized_questions.empty?

    ActiveRecord::Base.transaction do
      parameterized_questions.each do |eq|
        generate_for_question!(eq, students, classroom_exam)
      end
    end
  end

  private

  def self.generate_for_question!(exam_question, students, classroom_exam)
    if exam_question.shuffled?
      value_sets = unique_value_sets(exam_question.variables, students.size)
      students.each_with_index do |student, i|
        create_student_question!(exam_question, student, classroom_exam, value_sets[i])
      end
    else
      # Fixed mode: all students get the same values
      values = exam_question.fixed_values
      students.each do |student|
        create_student_question!(exam_question, student, classroom_exam, values)
      end
    end
  end

  def self.create_student_question!(exam_question, student, classroom_exam, values)
    generated_text = render_text(exam_question.template_text, values)
    correct_answer = FormulaEvaluator.evaluate_to_s(exam_question.formula, values)

    StudentQuestion.create!(
      exam_question: exam_question,
      student: student,
      classroom_exam: classroom_exam,
      values: values,
      generated_text: generated_text,
      correct_answer: correct_answer
    )
  end
end
```

**Step 4: Run tests**

Run: `cd backend && bin/rails test test/services/question_generator_test.rb`
Expected: All PASS

**Step 5: Commit**

```bash
git add backend/app/services/question_generator.rb backend/test/services/
git commit -m "feat: QuestionGenerator service — generates unique per-student question instances"
```

---

## Phase 2: Backend — GraphQL API

### Task 7: GraphQL types for parameterized questions

**Files:**
- Modify: `backend/app/graphql/types/exam_question_type.rb`
- Modify: `backend/app/graphql/types/exam_question_input_type.rb`
- Create: `backend/app/graphql/types/question_template_type.rb`
- Create: `backend/app/graphql/types/student_question_type.rb`
- Create: `backend/app/graphql/types/variable_input_type.rb`

**Step 1: Update ExamQuestionType**

Modify `backend/app/graphql/types/exam_question_type.rb`:

```ruby
# frozen_string_literal: true

module Types
  class ExamQuestionType < Types::BaseObject
    field :id, ID, null: false
    field :question_text, String
    field :options, GraphQL::Types::JSON
    field :correct_answer, String
    field :points, Integer, null: false
    field :position, Integer, null: false
    field :parameterized, Boolean, null: false
    field :template_text, String
    field :variables, GraphQL::Types::JSON
    field :formula, String
    field :value_mode, String
    field :fixed_values, GraphQL::Types::JSON
    field :student_questions, [Types::StudentQuestionType], null: false

    def value_mode
      object.value_mode
    end
  end
end
```

**Step 2: Create VariableInputType**

Create `backend/app/graphql/types/variable_input_type.rb`:

```ruby
# frozen_string_literal: true

module Types
  class VariableInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :min, Integer, required: true
    argument :max, Integer, required: true
  end
end
```

**Step 3: Update ExamQuestionInputType**

Modify `backend/app/graphql/types/exam_question_input_type.rb`:

```ruby
# frozen_string_literal: true

module Types
  class ExamQuestionInputType < Types::BaseInputObject
    argument :question_text, String, required: false
    argument :options, GraphQL::Types::JSON, required: false
    argument :correct_answer, String, required: false
    argument :points, Integer, required: false
    argument :position, Integer, required: false
    argument :parameterized, Boolean, required: false
    argument :template_text, String, required: false
    argument :variables, [Types::VariableInputType], required: false
    argument :formula, String, required: false
    argument :value_mode, String, required: false
    argument :fixed_values, GraphQL::Types::JSON, required: false
  end
end
```

**Step 4: Create QuestionTemplateType**

Create `backend/app/graphql/types/question_template_type.rb`:

```ruby
# frozen_string_literal: true

module Types
  class QuestionTemplateType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :category, String, null: false
    field :grade_min, Integer, null: false
    field :grade_max, Integer, null: false
    field :template_text, String, null: false
    field :variables, GraphQL::Types::JSON, null: false
    field :formula, String, null: false
  end
end
```

**Step 5: Create StudentQuestionType**

Create `backend/app/graphql/types/student_question_type.rb`:

```ruby
# frozen_string_literal: true

module Types
  class StudentQuestionType < Types::BaseObject
    field :id, ID, null: false
    field :exam_question_id, ID, null: false
    field :student_id, ID, null: false
    field :values, GraphQL::Types::JSON, null: false
    field :generated_text, String, null: false
    field :correct_answer, String, null: false
  end
end
```

**Step 6: Commit**

```bash
git add backend/app/graphql/types/
git commit -m "feat: GraphQL types for parameterized questions, templates, student questions"
```

---

### Task 8: GraphQL queries for templates + student questions

**Files:**
- Modify: `backend/app/graphql/types/query_type.rb`

**Step 1: Add query fields**

Add to `backend/app/graphql/types/query_type.rb`:

```ruby
field :question_templates, [Types::QuestionTemplateType], null: false,
  description: "List available question templates" do
  argument :category, String, required: false
  argument :grade, Integer, required: false
end

def question_templates(category: nil, grade: nil)
  authenticate!
  scope = QuestionTemplate.all
  scope = scope.by_category(category) if category
  scope = scope.for_grade(grade) if grade
  scope.order(:category, :name)
end

field :student_questions, [Types::StudentQuestionType], null: false,
  description: "Get student-specific questions for a classroom exam" do
  argument :classroom_exam_id, ID, required: true
  argument :student_id, ID, required: false
end

def student_questions(classroom_exam_id:, student_id: nil)
  authenticate!
  scope = StudentQuestion.where(classroom_exam_id: classroom_exam_id)
  scope = scope.where(student_id: student_id || context[:current_user].id)
  scope.includes(:exam_question)
end
```

**Step 2: Commit**

```bash
git add backend/app/graphql/types/query_type.rb
git commit -m "feat: GraphQL queries for questionTemplates and studentQuestions"
```

---

### Task 9: Update AssignExamToClassroom to trigger generation

**Files:**
- Modify: `backend/app/graphql/mutations/assign_exam_to_classroom.rb`

**Step 1: Add generation call after assignment**

Modify `backend/app/graphql/mutations/assign_exam_to_classroom.rb`:

```ruby
# frozen_string_literal: true

module Mutations
  class AssignExamToClassroom < BaseMutation
    argument :input, Types::AssignExamInputType, required: true

    field :classroom_exam, Types::ClassroomExamType
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless ClassroomExamPolicy.new(current_user, ClassroomExam.new).create?

      classroom_exam = ClassroomExam.new(input.to_h)
      classroom_exam.assigned_by = current_user
      classroom_exam.status = :active

      if classroom_exam.save
        # Generate student-specific questions for parameterized questions
        QuestionGenerator.generate_for_classroom_exam!(classroom_exam)
        { classroom_exam: classroom_exam, errors: [] }
      else
        { classroom_exam: nil, errors: classroom_exam.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } } }
      end
    end
  end
end
```

**Step 2: Commit**

```bash
git add backend/app/graphql/mutations/assign_exam_to_classroom.rb
git commit -m "feat: trigger QuestionGenerator on exam classroom assignment"
```

---

### Task 10: Update SubmitExamAnswers for parameterized auto-grading

**Files:**
- Modify: `backend/app/graphql/mutations/submit_exam_answers.rb`

**Step 1: Update the auto-grading logic**

Modify `backend/app/graphql/mutations/submit_exam_answers.rb`:

```ruby
# frozen_string_literal: true

module Mutations
  class SubmitExamAnswers < BaseMutation
    argument :input, Types::SubmitAnswersInputType, required: true

    field :exam_submission, Types::ExamSubmissionType
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      authenticate!
      classroom_exam = ClassroomExam.find(input.classroom_exam_id)
      exam = classroom_exam.exam

      submission = ExamSubmission.find_or_initialize_by(
        student_id: context[:current_user].id,
        classroom_exam: classroom_exam
      )

      ActiveRecord::Base.transaction do
        submission.status = :submitted
        submission.submitted_at = Time.current
        submission.save!

        if exam.multiple_choice?
          total_points = 0
          earned_points = 0

          input.answers.each do |answer_input|
            question = exam.exam_questions.find(answer_input.exam_question_id)

            # For parameterized questions, check against student-specific answer
            student_question = nil
            if question.parameterized?
              student_question = StudentQuestion.find_by(
                exam_question: question,
                student_id: context[:current_user].id,
                classroom_exam: classroom_exam
              )
              correct_answer = student_question&.correct_answer
            else
              correct_answer = question.correct_answer
            end

            correct = correct_answer == answer_input.selected_answer
            points = correct ? question.points : 0

            submission.exam_answers.create!(
              exam_question: question,
              student_question: student_question,
              selected_answer: answer_input.selected_answer,
              correct: correct,
              points_awarded: points
            )

            total_points += question.points
            earned_points += points
          end

          submission.score = (total_points > 0) ? (earned_points.to_f / total_points * 100).round(2) : 0
          submission.passed = submission.score >= classroom_exam.exam.topic.learning_objectives.first&.exam_pass_threshold.to_i
          submission.status = :graded
          submission.graded_at = Time.current
          submission.save!
        end
      end

      # Trigger mastery evaluation for auto-graded MC exams
      if exam.multiple_choice?
        topic = classroom_exam.exam.topic
        EvaluateMasteryJob.perform_later(submission.student_id, topic.id)
      end

      { exam_submission: submission, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { exam_submission: nil, errors: e.record.errors.map { |err| { message: err.full_message, path: [err.attribute.to_s.camelize(:lower)] } } }
    end
  end
end
```

**Step 2: Commit**

```bash
git add backend/app/graphql/mutations/submit_exam_answers.rb
git commit -m "feat: parameterized auto-grading in SubmitExamAnswers mutation"
```

---

## Phase 3: Frontend — Teacher Exam Creation UX

### Task 11: Add GraphQL queries for templates and parameterized questions

**Files:**
- Modify: `front-end/src/lib/api/queries/curriculum.ts`
- Modify: `front-end/src/lib/api/types.ts`

**Step 1: Add queries**

Add to `front-end/src/lib/api/queries/curriculum.ts`:

```typescript
export const QUESTION_TEMPLATES_QUERY = `
  query QuestionTemplates($category: String, $grade: Int) {
    questionTemplates(category: $category, grade: $grade) {
      id
      name
      category
      gradeMin
      gradeMax
      templateText
      variables
      formula
    }
  }
`;

export const STUDENT_QUESTIONS_QUERY = `
  query StudentQuestions($classroomExamId: ID!, $studentId: ID) {
    studentQuestions(classroomExamId: $classroomExamId, studentId: $studentId) {
      id
      examQuestionId
      studentId
      values
      generatedText
      correctAnswer
    }
  }
`;
```

**Step 2: Add types**

Add to `front-end/src/lib/api/types.ts`:

```typescript
export interface QuestionTemplate {
  id: string;
  name: string;
  category: string;
  gradeMin: number;
  gradeMax: number;
  templateText: string;
  variables: VariableDefinition[];
  formula: string;
}

export interface VariableDefinition {
  name: string;
  min: number;
  max: number;
}

export interface StudentQuestion {
  id: string;
  examQuestionId: string;
  studentId: string;
  values: Record<string, number>;
  generatedText: string;
  correctAnswer: string;
}
```

**Step 3: Update CREATE_EXAM_MUTATION to include parameterized fields**

Update the mutation in `front-end/src/lib/api/queries/curriculum.ts` — already handles `questions` array, just need the new fields in the input which GraphQL handles via the updated input type.

**Step 4: Commit**

```bash
git add front-end/src/lib/api/
git commit -m "feat: frontend GraphQL queries and types for parameterized questions"
```

---

### Task 12: Update exam creation page with parameterized question toggle

**Files:**
- Modify: `front-end/src/routes/teacher/exams/new/+page.server.ts` — load templates
- Modify: `front-end/src/routes/teacher/exams/new/+page.svelte` — add parameterized UI

This task involves significant UI work. The exam creation form needs:
1. A "Parameterized" toggle per question
2. When toggled ON: show template picker OR custom template input
3. Variable range editors
4. Value mode selector (fixed/shuffled)
5. Preview of generated question

**Step 1: Update server load to fetch templates**

In `front-end/src/routes/teacher/exams/new/+page.server.ts`, add template fetching alongside existing data:

```typescript
// Add to the load function's Promise.all:
graphql<{ questionTemplates: QuestionTemplate[] }>(
  QUESTION_TEMPLATES_QUERY, {}, locals.accessToken!
)
```

Return `questionTemplates` in the load data.

**Step 2: Update the svelte page**

Add to each question in the question builder:
- Toggle: "Parameterized question"
- When ON: template library dropdown + custom option
- Variable range inputs (auto-populated from template, editable)
- Value mode: "Same for all students" / "Unique per student"
- If fixed: value inputs for each variable
- Live preview: renders template with sample values

**Step 3: Update form submission to include parameterized fields**

The `+page.server.ts` action already serializes questions to the GraphQL mutation. Add the new fields (parameterized, templateText, variables, formula, valueMode, fixedValues) to the serialization.

**Step 4: Commit**

```bash
git add front-end/src/routes/teacher/exams/new/
git commit -m "feat: parameterized question UI in exam creation (template picker, variable ranges, preview)"
```

---

### Task 13: Update student exam-taking view for parameterized questions

**Files:**
- Modify student exam pages to fetch `studentQuestions` and display `generatedText` instead of `questionText` for parameterized questions

**Step 1: When loading an exam for a student, also fetch their StudentQuestion records**

**Step 2: In the question display, check if `parameterized` → show `generatedText` from StudentQuestion instead of `questionText`**

**Step 3: Commit**

```bash
git commit -m "feat: student exam view uses personalized question text for parameterized questions"
```

---

## Phase 4: Testing & Seed Data

### Task 14: Integration test for full flow

**Files:**
- Create: `backend/test/integration/parameterized_exam_flow_test.rb`

Write an integration test covering:
1. Create exam with parameterized question
2. Assign to classroom
3. Verify StudentQuestion records generated for each student
4. Submit answers as student
5. Verify auto-grading uses per-student correct answer

### Task 15: Seed data for development

**Files:**
- Modify: `backend/db/seeds.rb` — load question_templates seed
- Add a parameterized exam example to existing seed data

Run: `cd backend && bin/rails db:seed`

### Task 16: Run full test suite

Run: `cd backend && bin/rails test`
Expected: All tests pass, 0 failures

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 (DB + Models) | Tasks 1-6 | Schema, models, FormulaEvaluator, QuestionGenerator |
| 2 (GraphQL API) | Tasks 7-10 | API types, queries, generation trigger, auto-grading |
| 3 (Frontend) | Tasks 11-13 | Template picker, question builder, student view |
| 4 (Testing) | Tasks 14-16 | Integration tests, seed data, full suite verification |
