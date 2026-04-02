# Curriculum & Exam System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a curriculum management system (Subject → Topic → Learning Objective) with multi-type exams (score-based, multiple choice, rubric, pass/fail) and per-objective mastery tracking that combines exam results with daily score averages.

**Architecture:** New models for curriculum hierarchy (Subject, Topic, LearningObjective) and exam system (Exam, ExamQuestion, RubricCriteria, ClassroomExam, ExamSubmission, ExamAnswer, RubricScore, ObjectiveMastery). Both teachers and school managers can manage curriculum. Exams are tied to topics but assigned to classrooms. Mastery thresholds are per-objective, set by teachers. DailyScore system remains separate and unchanged.

**Tech Stack:** Rails 8.1.2, PostgreSQL, graphql-ruby 2.5, Minitest, Pundit, PublicActivity, fixtures

---

## Phase 1: Curriculum Models & Migration (Subject → Topic → LearningObjective)

### Task 1: Create the curriculum migration

**Files:**
- Create: `db/migrate/YYYYMMDDHHMMSS_create_curriculum_tables.rb`

**Step 1: Generate the migration**

Run: `bin/rails generate migration CreateCurriculumTables`
Expected: Creates empty migration file

**Step 2: Write the migration**

```ruby
class CreateCurriculumTables < ActiveRecord::Migration[8.1]
  def change
    create_table :subjects do |t|
      t.string :name, null: false
      t.text :description
      t.references :school, null: false, foreign_key: true
      t.timestamps
    end

    add_index :subjects, [:school_id, :name], unique: true

    create_table :topics do |t|
      t.string :name, null: false
      t.text :description
      t.references :subject, null: false, foreign_key: true
      t.integer :position, default: 0, null: false
      t.timestamps
    end

    add_index :topics, [:subject_id, :name], unique: true

    create_table :learning_objectives do |t|
      t.string :name, null: false
      t.text :description
      t.references :topic, null: false, foreign_key: true
      t.integer :exam_pass_threshold, null: false, default: 70
      t.integer :daily_score_threshold, null: false, default: 75
      t.integer :position, default: 0, null: false
      t.timestamps
    end

    add_index :learning_objectives, [:topic_id, :name], unique: true
  end
end
```

**Step 3: Run the migration**

Run: `bin/rails db:migrate`
Expected: Tables created, schema.rb updated

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(curriculum): add subjects, topics, learning_objectives tables"
```

---

### Task 2: Create Subject model with tests

**Files:**
- Create: `app/models/subject.rb`
- Create: `test/models/subject_test.rb`
- Create: `test/fixtures/subjects.yml`
- Modify: `app/models/school.rb` (add `has_many :subjects`)

**Step 1: Create the fixture**

`test/fixtures/subjects.yml`:
```yaml
math:
  name: Mathematics
  description: "Core math curriculum"
  school: greenwood

reading:
  name: Reading
  description: "Reading and comprehension"
  school: greenwood
```

**Step 2: Write the failing tests**

`test/models/subject_test.rb`:
```ruby
require "test_helper"

class SubjectTest < ActiveSupport::TestCase
  test "validates name presence" do
    subject = Subject.new(school: schools(:greenwood), description: "test")
    assert_not subject.valid?
    assert_includes subject.errors[:name], "can't be blank"
  end

  test "validates name uniqueness per school" do
    existing = subjects(:math)
    duplicate = Subject.new(name: existing.name, school: existing.school)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:name], "has already been taken"
  end

  test "allows same name in different schools" do
    other_school = School.create!(name: "Other School")
    subject = Subject.new(name: "Mathematics", school: other_school)
    assert subject.valid?
  end

  test "belongs to school" do
    subject = subjects(:math)
    assert_equal schools(:greenwood), subject.school
  end

  test "has many topics" do
    subject = subjects(:math)
    assert_respond_to subject, :topics
  end

  test "destroys dependent topics" do
    subject = subjects(:math)
    subject.topics.create!(name: "Algebra")
    assert_difference "Topic.count", -1 do
      subject.destroy
    end
  end
end
```

**Step 3: Run tests to verify they fail**

Run: `bin/rails test test/models/subject_test.rb`
Expected: FAIL — Subject model doesn't exist yet

**Step 4: Create the Subject model**

`app/models/subject.rb`:
```ruby
class Subject < ApplicationRecord
  include PublicActivity::Model
  tracked

  belongs_to :school
  has_many :topics, dependent: :destroy

  validates :name, presence: true, uniqueness: { scope: :school_id }
end
```

**Step 5: Add association to School**

In `app/models/school.rb`, add:
```ruby
has_many :subjects, dependent: :destroy
```

**Step 6: Run tests to verify they pass**

Run: `bin/rails test test/models/subject_test.rb`
Expected: All PASS

**Step 7: Commit**

```bash
git add -A && git commit -m "feat(curriculum): add Subject model with validations and tests"
```

---

### Task 3: Create Topic model with tests

**Files:**
- Create: `app/models/topic.rb`
- Create: `test/models/topic_test.rb`
- Create: `test/fixtures/topics.yml`

**Step 1: Create the fixture**

`test/fixtures/topics.yml`:
```yaml
fractions:
  name: Fractions
  description: "Working with fractions"
  subject: math
  position: 0

algebra:
  name: Algebra
  description: "Basic algebra"
  subject: math
  position: 1

poetry:
  name: Poetry
  description: "Reading and writing poetry"
  subject: reading
  position: 0
```

**Step 2: Write the failing tests**

`test/models/topic_test.rb`:
```ruby
require "test_helper"

class TopicTest < ActiveSupport::TestCase
  test "validates name presence" do
    topic = Topic.new(subject: subjects(:math))
    assert_not topic.valid?
    assert_includes topic.errors[:name], "can't be blank"
  end

  test "validates name uniqueness per subject" do
    existing = topics(:fractions)
    duplicate = Topic.new(name: existing.name, subject: existing.subject)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:name], "has already been taken"
  end

  test "allows same name in different subjects" do
    topic = Topic.new(name: "Fractions", subject: subjects(:reading))
    assert topic.valid?
  end

  test "belongs to subject" do
    topic = topics(:fractions)
    assert_equal subjects(:math), topic.subject
  end

  test "has many learning_objectives" do
    topic = topics(:fractions)
    assert_respond_to topic, :learning_objectives
  end

  test "destroys dependent learning_objectives" do
    topic = topics(:fractions)
    topic.learning_objectives.create!(name: "Add fractions")
    assert_difference "LearningObjective.count", -1 do
      topic.destroy
    end
  end

  test "has position default 0" do
    topic = Topic.new(name: "New Topic", subject: subjects(:math))
    assert_equal 0, topic.position
  end
end
```

**Step 3: Run tests to verify they fail**

Run: `bin/rails test test/models/topic_test.rb`
Expected: FAIL

**Step 4: Create the Topic model**

`app/models/topic.rb`:
```ruby
class Topic < ApplicationRecord
  include PublicActivity::Model
  tracked

  belongs_to :subject
  has_many :learning_objectives, dependent: :destroy

  validates :name, presence: true, uniqueness: { scope: :subject_id }

  default_scope { order(:position) }
end
```

**Step 5: Run tests to verify they pass**

Run: `bin/rails test test/models/topic_test.rb`
Expected: All PASS

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(curriculum): add Topic model with validations and tests"
```

---

### Task 4: Create LearningObjective model with tests

**Files:**
- Create: `app/models/learning_objective.rb`
- Create: `test/models/learning_objective_test.rb`
- Create: `test/fixtures/learning_objectives.yml`

**Step 1: Create the fixture**

`test/fixtures/learning_objectives.yml`:
```yaml
add_fractions:
  name: "Add fractions with different denominators"
  description: "Student can add fractions with unlike denominators"
  topic: fractions
  exam_pass_threshold: 70
  daily_score_threshold: 75
  position: 0

simplify_fractions:
  name: "Simplify fractions to lowest terms"
  topic: fractions
  exam_pass_threshold: 80
  daily_score_threshold: 80
  position: 1

solve_linear:
  name: "Solve linear equations"
  topic: algebra
  exam_pass_threshold: 70
  daily_score_threshold: 70
  position: 0
```

**Step 2: Write the failing tests**

`test/models/learning_objective_test.rb`:
```ruby
require "test_helper"

class LearningObjectiveTest < ActiveSupport::TestCase
  test "validates name presence" do
    obj = LearningObjective.new(topic: topics(:fractions))
    assert_not obj.valid?
    assert_includes obj.errors[:name], "can't be blank"
  end

  test "validates name uniqueness per topic" do
    existing = learning_objectives(:add_fractions)
    duplicate = LearningObjective.new(name: existing.name, topic: existing.topic)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:name], "has already been taken"
  end

  test "belongs to topic" do
    obj = learning_objectives(:add_fractions)
    assert_equal topics(:fractions), obj.topic
  end

  test "exam_pass_threshold defaults to 70" do
    obj = LearningObjective.new(name: "Test", topic: topics(:fractions))
    obj.valid?
    assert_equal 70, obj.exam_pass_threshold
  end

  test "daily_score_threshold defaults to 75" do
    obj = LearningObjective.new(name: "Test", topic: topics(:fractions))
    obj.valid?
    assert_equal 75, obj.daily_score_threshold
  end

  test "validates exam_pass_threshold range 0-100" do
    obj = LearningObjective.new(name: "Test", topic: topics(:fractions), exam_pass_threshold: 101)
    assert_not obj.valid?
    assert_includes obj.errors[:exam_pass_threshold], "must be less than or equal to 100"

    obj.exam_pass_threshold = -1
    assert_not obj.valid?
    assert_includes obj.errors[:exam_pass_threshold], "must be greater than or equal to 0"
  end

  test "validates daily_score_threshold range 0-100" do
    obj = LearningObjective.new(name: "Test", topic: topics(:fractions), daily_score_threshold: 101)
    assert_not obj.valid?
    assert_includes obj.errors[:daily_score_threshold], "must be less than or equal to 100"
  end

  test "can access subject through topic" do
    obj = learning_objectives(:add_fractions)
    assert_equal subjects(:math), obj.topic.subject
  end
end
```

**Step 3: Run tests to verify they fail**

Run: `bin/rails test test/models/learning_objective_test.rb`
Expected: FAIL

**Step 4: Create the LearningObjective model**

`app/models/learning_objective.rb`:
```ruby
class LearningObjective < ApplicationRecord
  include PublicActivity::Model
  tracked

  belongs_to :topic

  validates :name, presence: true, uniqueness: { scope: :topic_id }
  validates :exam_pass_threshold, numericality: { only_integer: true, in: 0..100 }
  validates :daily_score_threshold, numericality: { only_integer: true, in: 0..100 }

  default_scope { order(:position) }

  def subject
    topic.subject
  end
end
```

**Step 5: Run tests to verify they pass**

Run: `bin/rails test test/models/learning_objective_test.rb`
Expected: All PASS

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(curriculum): add LearningObjective model with thresholds and tests"
```

---

## Phase 2: Exam Models & Migration

### Task 5: Create the exam migration

**Files:**
- Create: `db/migrate/YYYYMMDDHHMMSS_create_exam_tables.rb`

**Step 1: Generate the migration**

Run: `bin/rails generate migration CreateExamTables`

**Step 2: Write the migration**

```ruby
class CreateExamTables < ActiveRecord::Migration[8.1]
  def change
    create_table :exams do |t|
      t.string :title, null: false
      t.text :description
      t.integer :exam_type, null: false, default: 0
      t.references :topic, null: false, foreign_key: true
      t.references :created_by, polymorphic: true, null: false
      t.integer :max_score, default: 100
      t.integer :duration_minutes
      t.timestamps
    end

    add_index :exams, [:topic_id, :exam_type]

    create_table :exam_questions do |t|
      t.references :exam, null: false, foreign_key: true
      t.text :question_text, null: false
      t.jsonb :options, default: []
      t.string :correct_answer, null: false
      t.integer :points, null: false, default: 1
      t.integer :position, default: 0, null: false
      t.timestamps
    end

    add_index :exam_questions, [:exam_id, :position]

    create_table :rubric_criteria do |t|
      t.references :exam, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.integer :max_score, null: false, default: 5
      t.integer :position, default: 0, null: false
      t.timestamps
    end

    add_index :rubric_criteria, [:exam_id, :position]

    create_table :classroom_exams do |t|
      t.references :exam, null: false, foreign_key: true
      t.references :classroom, null: false, foreign_key: true
      t.references :assigned_by, polymorphic: true, null: false
      t.datetime :scheduled_at
      t.datetime :due_at
      t.integer :status, null: false, default: 0
      t.timestamps
    end

    add_index :classroom_exams, [:classroom_id, :exam_id], unique: true
    add_index :classroom_exams, [:classroom_id, :status]

    create_table :exam_submissions do |t|
      t.references :student, null: false, foreign_key: true
      t.references :classroom_exam, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.decimal :score, precision: 5, scale: 2
      t.boolean :passed
      t.datetime :started_at
      t.datetime :submitted_at
      t.datetime :graded_at
      t.text :teacher_notes
      t.timestamps
    end

    add_index :exam_submissions, [:student_id, :classroom_exam_id], unique: true

    create_table :exam_answers do |t|
      t.references :exam_submission, null: false, foreign_key: true
      t.references :exam_question, null: false, foreign_key: true
      t.string :selected_answer
      t.boolean :correct
      t.integer :points_awarded, default: 0
      t.timestamps
    end

    add_index :exam_answers, [:exam_submission_id, :exam_question_id], unique: true

    create_table :rubric_scores do |t|
      t.references :exam_submission, null: false, foreign_key: true
      t.references :rubric_criteria, null: false, foreign_key: true
      t.integer :score, null: false
      t.text :feedback
      t.timestamps
    end

    add_index :rubric_scores, [:exam_submission_id, :rubric_criteria_id], unique: true, name: "idx_rubric_scores_unique"

    create_table :objective_masteries do |t|
      t.references :student, null: false, foreign_key: true
      t.references :learning_objective, null: false, foreign_key: true
      t.boolean :exam_mastered, default: false, null: false
      t.boolean :daily_mastered, default: false, null: false
      t.datetime :mastered_at
      t.timestamps
    end

    add_index :objective_masteries, [:student_id, :learning_objective_id], unique: true, name: "idx_objective_masteries_unique"
  end
end
```

**Step 3: Run the migration**

Run: `bin/rails db:migrate`
Expected: All tables created

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(exam): add exam, submission, and mastery tables"
```

---

### Task 6: Create Exam model with tests

**Files:**
- Create: `app/models/exam.rb`
- Create: `test/models/exam_test.rb`
- Create: `test/fixtures/exams.yml`

**Step 1: Create the fixture**

`test/fixtures/exams.yml`:
```yaml
fractions_score_exam:
  title: "Fractions Quiz"
  description: "Score-based fractions quiz"
  exam_type: 0
  topic: fractions
  created_by_type: Teacher
  created_by_id: <%= ActiveRecord::FixtureSet.identify(:teacher_alice) %>
  max_score: 100

fractions_mc_exam:
  title: "Fractions Multiple Choice"
  exam_type: 1
  topic: fractions
  created_by_type: Teacher
  created_by_id: <%= ActiveRecord::FixtureSet.identify(:teacher_alice) %>
  max_score: 10

poetry_rubric_exam:
  title: "Poetry Analysis"
  exam_type: 2
  topic: poetry
  created_by_type: Teacher
  created_by_id: <%= ActiveRecord::FixtureSet.identify(:teacher_alice) %>

algebra_pass_fail:
  title: "Algebra Competency Check"
  exam_type: 3
  topic: algebra
  created_by_type: Teacher
  created_by_id: <%= ActiveRecord::FixtureSet.identify(:teacher_alice) %>
```

**Step 2: Write the failing tests**

`test/models/exam_test.rb`:
```ruby
require "test_helper"

class ExamTest < ActiveSupport::TestCase
  test "validates title presence" do
    exam = Exam.new(topic: topics(:fractions), exam_type: :score_based, created_by: teachers(:teacher_alice))
    assert_not exam.valid?
    assert_includes exam.errors[:title], "can't be blank"
  end

  test "validates exam_type presence" do
    exam = Exam.new(title: "Test", topic: topics(:fractions), created_by: teachers(:teacher_alice), exam_type: nil)
    assert_not exam.valid?
  end

  test "exam_type enum has 4 entries" do
    assert_equal 4, Exam.exam_types.size
    assert_equal %w[score_based multiple_choice rubric pass_fail], Exam.exam_types.keys
  end

  test "belongs to topic" do
    exam = exams(:fractions_score_exam)
    assert_equal topics(:fractions), exam.topic
  end

  test "belongs to created_by (polymorphic)" do
    exam = exams(:fractions_score_exam)
    assert_equal teachers(:teacher_alice), exam.created_by
  end

  test "has many exam_questions" do
    exam = exams(:fractions_mc_exam)
    assert_respond_to exam, :exam_questions
  end

  test "has many rubric_criteria" do
    exam = exams(:poetry_rubric_exam)
    assert_respond_to exam, :rubric_criteria
  end

  test "has many classroom_exams" do
    exam = exams(:fractions_score_exam)
    assert_respond_to exam, :classroom_exams
  end

  test "can access subject through topic" do
    exam = exams(:fractions_score_exam)
    assert_equal subjects(:math), exam.topic.subject
  end
end
```

**Step 3: Run tests to verify they fail**

Run: `bin/rails test test/models/exam_test.rb`
Expected: FAIL

**Step 4: Create the Exam model**

`app/models/exam.rb`:
```ruby
class Exam < ApplicationRecord
  include PublicActivity::Model
  tracked

  belongs_to :topic
  belongs_to :created_by, polymorphic: true

  has_many :exam_questions, dependent: :destroy
  has_many :rubric_criteria, dependent: :destroy
  has_many :classroom_exams, dependent: :destroy

  enum :exam_type, { score_based: 0, multiple_choice: 1, rubric: 2, pass_fail: 3 }

  validates :title, presence: true
  validates :exam_type, presence: true
  validates :max_score, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :duration_minutes, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

  def subject
    topic.subject
  end
end
```

**Step 5: Run tests to verify they pass**

Run: `bin/rails test test/models/exam_test.rb`
Expected: All PASS

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(exam): add Exam model with 4 exam types and tests"
```

---

### Task 7: Create ExamQuestion model with tests

**Files:**
- Create: `app/models/exam_question.rb`
- Create: `test/models/exam_question_test.rb`
- Create: `test/fixtures/exam_questions.yml`

**Step 1: Create the fixture**

`test/fixtures/exam_questions.yml`:
```yaml
mc_q1:
  exam: fractions_mc_exam
  question_text: "What is 1/2 + 1/4?"
  options: '<%= [{"label": "A", "text": "2/6"}, {"label": "B", "text": "3/4"}, {"label": "C", "text": "1/3"}, {"label": "D", "text": "2/4"}].to_json %>'
  correct_answer: "B"
  points: 2
  position: 0

mc_q2:
  exam: fractions_mc_exam
  question_text: "Simplify 4/8"
  options: '<%= [{"label": "A", "text": "1/2"}, {"label": "B", "text": "2/4"}, {"label": "C", "text": "1/4"}, {"label": "D", "text": "3/4"}].to_json %>'
  correct_answer: "A"
  points: 2
  position: 1
```

**Step 2: Write the failing tests**

`test/models/exam_question_test.rb`:
```ruby
require "test_helper"

class ExamQuestionTest < ActiveSupport::TestCase
  test "validates question_text presence" do
    q = ExamQuestion.new(exam: exams(:fractions_mc_exam), correct_answer: "A")
    assert_not q.valid?
    assert_includes q.errors[:question_text], "can't be blank"
  end

  test "validates correct_answer presence" do
    q = ExamQuestion.new(exam: exams(:fractions_mc_exam), question_text: "What?")
    assert_not q.valid?
    assert_includes q.errors[:correct_answer], "can't be blank"
  end

  test "belongs to exam" do
    q = exam_questions(:mc_q1)
    assert_equal exams(:fractions_mc_exam), q.exam
  end

  test "points defaults to 1" do
    q = ExamQuestion.new
    assert_equal 1, q.points
  end

  test "options stored as jsonb" do
    q = exam_questions(:mc_q1)
    assert_kind_of Array, q.options
  end
end
```

**Step 3: Run tests to verify they fail**

Run: `bin/rails test test/models/exam_question_test.rb`
Expected: FAIL

**Step 4: Create the ExamQuestion model**

`app/models/exam_question.rb`:
```ruby
class ExamQuestion < ApplicationRecord
  belongs_to :exam

  validates :question_text, presence: true
  validates :correct_answer, presence: true
  validates :points, numericality: { only_integer: true, greater_than: 0 }

  default_scope { order(:position) }
end
```

**Step 5: Run tests to verify they pass**

Run: `bin/rails test test/models/exam_question_test.rb`
Expected: All PASS

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(exam): add ExamQuestion model for multiple choice exams"
```

---

### Task 8: Create RubricCriteria model with tests

**Files:**
- Create: `app/models/rubric_criteria.rb`
- Create: `test/models/rubric_criteria_test.rb`
- Create: `test/fixtures/rubric_criteria.yml`

**Step 1: Create the fixture**

`test/fixtures/rubric_criteria.yml`:
```yaml
creativity:
  exam: poetry_rubric_exam
  name: Creativity
  description: "Originality and creative expression"
  max_score: 5
  position: 0

accuracy:
  exam: poetry_rubric_exam
  name: Accuracy
  description: "Factual and grammatical accuracy"
  max_score: 5
  position: 1
```

**Step 2: Write the failing tests**

`test/models/rubric_criteria_test.rb`:
```ruby
require "test_helper"

class RubricCriteriaTest < ActiveSupport::TestCase
  test "validates name presence" do
    rc = RubricCriteria.new(exam: exams(:poetry_rubric_exam), max_score: 5)
    assert_not rc.valid?
    assert_includes rc.errors[:name], "can't be blank"
  end

  test "validates max_score is positive integer" do
    rc = RubricCriteria.new(name: "Test", exam: exams(:poetry_rubric_exam), max_score: 0)
    assert_not rc.valid?

    rc.max_score = -1
    assert_not rc.valid?
  end

  test "belongs to exam" do
    rc = rubric_criteria(:creativity)
    assert_equal exams(:poetry_rubric_exam), rc.exam
  end

  test "max_score defaults to 5" do
    rc = RubricCriteria.new
    assert_equal 5, rc.max_score
  end
end
```

**Step 3: Run tests to verify they fail**

Run: `bin/rails test test/models/rubric_criteria_test.rb`
Expected: FAIL

**Step 4: Create the RubricCriteria model**

`app/models/rubric_criteria.rb`:
```ruby
class RubricCriteria < ApplicationRecord
  belongs_to :exam

  validates :name, presence: true
  validates :max_score, numericality: { only_integer: true, greater_than: 0 }

  default_scope { order(:position) }
end
```

**Step 5: Run tests to verify they pass**

Run: `bin/rails test test/models/rubric_criteria_test.rb`
Expected: All PASS

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(exam): add RubricCriteria model for rubric-based exams"
```

---

### Task 9: Create ClassroomExam model with tests

**Files:**
- Create: `app/models/classroom_exam.rb`
- Create: `test/models/classroom_exam_test.rb`
- Create: `test/fixtures/classroom_exams.yml`
- Modify: `app/models/classroom.rb` (add `has_many :classroom_exams`)

**Step 1: Create the fixture**

`test/fixtures/classroom_exams.yml`:
```yaml
alice_fractions_quiz:
  exam: fractions_score_exam
  classroom: alice_class
  assigned_by_type: Teacher
  assigned_by_id: <%= ActiveRecord::FixtureSet.identify(:teacher_alice) %>
  status: 0
  scheduled_at: <%= Time.zone.parse("2026-03-10 09:00:00") %>
  due_at: <%= Time.zone.parse("2026-03-10 10:00:00") %>

alice_mc_exam:
  exam: fractions_mc_exam
  classroom: alice_class
  assigned_by_type: Teacher
  assigned_by_id: <%= ActiveRecord::FixtureSet.identify(:teacher_alice) %>
  status: 0
```

**Step 2: Write the failing tests**

`test/models/classroom_exam_test.rb`:
```ruby
require "test_helper"

class ClassroomExamTest < ActiveSupport::TestCase
  test "belongs to exam and classroom" do
    ce = classroom_exams(:alice_fractions_quiz)
    assert_equal exams(:fractions_score_exam), ce.exam
    assert_equal classrooms(:alice_class), ce.classroom
  end

  test "belongs to assigned_by (polymorphic)" do
    ce = classroom_exams(:alice_fractions_quiz)
    assert_equal teachers(:teacher_alice), ce.assigned_by
  end

  test "unique exam per classroom" do
    existing = classroom_exams(:alice_fractions_quiz)
    duplicate = ClassroomExam.new(exam: existing.exam, classroom: existing.classroom, assigned_by: teachers(:teacher_alice))
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:exam_id], "has already been taken"
  end

  test "status enum" do
    assert_equal %w[draft active closed], ClassroomExam.statuses.keys
  end

  test "has many exam_submissions" do
    ce = classroom_exams(:alice_fractions_quiz)
    assert_respond_to ce, :exam_submissions
  end
end
```

**Step 3: Run tests to verify they fail**

Run: `bin/rails test test/models/classroom_exam_test.rb`
Expected: FAIL

**Step 4: Create the ClassroomExam model**

`app/models/classroom_exam.rb`:
```ruby
class ClassroomExam < ApplicationRecord
  belongs_to :exam
  belongs_to :classroom
  belongs_to :assigned_by, polymorphic: true

  has_many :exam_submissions, dependent: :destroy

  enum :status, { draft: 0, active: 1, closed: 2 }

  validates :exam_id, uniqueness: { scope: :classroom_id }

  scope :upcoming, -> { where("scheduled_at > ?", Time.current) }
  scope :active_exams, -> { active.where("due_at IS NULL OR due_at > ?", Time.current) }
end
```

**Step 5: Add association to Classroom**

In `app/models/classroom.rb`, add:
```ruby
has_many :classroom_exams, dependent: :destroy
has_many :exams, through: :classroom_exams
```

**Step 6: Run tests to verify they pass**

Run: `bin/rails test test/models/classroom_exam_test.rb`
Expected: All PASS

**Step 7: Commit**

```bash
git add -A && git commit -m "feat(exam): add ClassroomExam model for assigning exams to classrooms"
```

---

### Task 10: Create ExamSubmission model with tests

**Files:**
- Create: `app/models/exam_submission.rb`
- Create: `test/models/exam_submission_test.rb`
- Create: `test/fixtures/exam_submissions.yml`
- Modify: `app/models/student.rb` (add `has_many :exam_submissions`)

**Step 1: Create the fixture**

`test/fixtures/exam_submissions.yml`:
```yaml
emma_fractions_quiz:
  student: student_emma
  classroom_exam: alice_fractions_quiz
  status: 2
  score: 85.00
  passed: true
  submitted_at: <%= Time.zone.parse("2026-03-10 09:45:00") %>
  graded_at: <%= Time.zone.parse("2026-03-10 10:00:00") %>
```

**Step 2: Write the failing tests**

`test/models/exam_submission_test.rb`:
```ruby
require "test_helper"

class ExamSubmissionTest < ActiveSupport::TestCase
  test "belongs to student and classroom_exam" do
    sub = exam_submissions(:emma_fractions_quiz)
    assert_equal students(:student_emma), sub.student
    assert_equal classroom_exams(:alice_fractions_quiz), sub.classroom_exam
  end

  test "unique student per classroom_exam" do
    existing = exam_submissions(:emma_fractions_quiz)
    duplicate = ExamSubmission.new(student: existing.student, classroom_exam: existing.classroom_exam)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:student_id], "has already been taken"
  end

  test "status enum" do
    assert_equal %w[not_started in_progress submitted graded], ExamSubmission.statuses.keys
  end

  test "has many exam_answers" do
    sub = exam_submissions(:emma_fractions_quiz)
    assert_respond_to sub, :exam_answers
  end

  test "has many rubric_scores" do
    sub = exam_submissions(:emma_fractions_quiz)
    assert_respond_to sub, :rubric_scores
  end

  test "score can be decimal" do
    sub = exam_submissions(:emma_fractions_quiz)
    assert_equal 85.0, sub.score.to_f
  end
end
```

**Step 3: Run tests to verify they fail**

Run: `bin/rails test test/models/exam_submission_test.rb`
Expected: FAIL

**Step 4: Create the ExamSubmission model**

`app/models/exam_submission.rb`:
```ruby
class ExamSubmission < ApplicationRecord
  include PublicActivity::Model
  tracked

  belongs_to :student
  belongs_to :classroom_exam

  has_many :exam_answers, dependent: :destroy
  has_many :rubric_scores, dependent: :destroy

  enum :status, { not_started: 0, in_progress: 1, submitted: 2, graded: 3 }

  validates :student_id, uniqueness: { scope: :classroom_exam_id }

  scope :graded, -> { where(status: :graded) }
  scope :for_student, ->(student_id) { where(student_id: student_id) }

  def exam
    classroom_exam.exam
  end

  def passed?
    !!passed
  end
end
```

**Step 5: Add association to Student**

In `app/models/student.rb`, add:
```ruby
has_many :exam_submissions, dependent: :destroy
```

**Step 6: Run tests to verify they pass**

Run: `bin/rails test test/models/exam_submission_test.rb`
Expected: All PASS

**Step 7: Commit**

```bash
git add -A && git commit -m "feat(exam): add ExamSubmission model with status tracking"
```

---

### Task 11: Create ExamAnswer and RubricScore models with tests

**Files:**
- Create: `app/models/exam_answer.rb`
- Create: `app/models/rubric_score.rb`
- Create: `test/models/exam_answer_test.rb`
- Create: `test/models/rubric_score_test.rb`
- Create: `test/fixtures/exam_answers.yml`
- Create: `test/fixtures/rubric_scores.yml`

**Step 1: Create fixtures**

`test/fixtures/exam_answers.yml`:
```yaml
# Empty for now — exam_answers depend on MC exam submissions
# which we'll create in integration tests
```

`test/fixtures/rubric_scores.yml`:
```yaml
# Empty for now — rubric_scores depend on rubric exam submissions
# which we'll create in integration tests
```

**Step 2: Write the failing tests**

`test/models/exam_answer_test.rb`:
```ruby
require "test_helper"

class ExamAnswerTest < ActiveSupport::TestCase
  test "belongs to exam_submission and exam_question" do
    assert ExamAnswer.reflect_on_association(:exam_submission)
    assert ExamAnswer.reflect_on_association(:exam_question)
  end

  test "points_awarded defaults to 0" do
    answer = ExamAnswer.new
    assert_equal 0, answer.points_awarded
  end
end
```

`test/models/rubric_score_test.rb`:
```ruby
require "test_helper"

class RubricScoreTest < ActiveSupport::TestCase
  test "belongs to exam_submission and rubric_criteria" do
    assert RubricScore.reflect_on_association(:exam_submission)
    assert RubricScore.reflect_on_association(:rubric_criteria)
  end

  test "validates score presence" do
    rs = RubricScore.new
    assert_not rs.valid?
    assert_includes rs.errors[:score], "can't be blank"
  end

  test "validates score is non-negative integer" do
    rs = RubricScore.new(score: -1)
    assert_not rs.valid?
  end
end
```

**Step 3: Run tests to verify they fail**

Run: `bin/rails test test/models/exam_answer_test.rb test/models/rubric_score_test.rb`
Expected: FAIL

**Step 4: Create the models**

`app/models/exam_answer.rb`:
```ruby
class ExamAnswer < ApplicationRecord
  belongs_to :exam_submission
  belongs_to :exam_question

  validates :exam_question_id, uniqueness: { scope: :exam_submission_id }
end
```

`app/models/rubric_score.rb`:
```ruby
class RubricScore < ApplicationRecord
  belongs_to :exam_submission
  belongs_to :rubric_criteria

  validates :score, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :rubric_criteria_id, uniqueness: { scope: :exam_submission_id }
end
```

**Step 5: Run tests to verify they pass**

Run: `bin/rails test test/models/exam_answer_test.rb test/models/rubric_score_test.rb`
Expected: All PASS

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(exam): add ExamAnswer and RubricScore models"
```

---

### Task 12: Create ObjectiveMastery model with tests

**Files:**
- Create: `app/models/objective_mastery.rb`
- Create: `test/models/objective_mastery_test.rb`
- Create: `test/fixtures/objective_masteries.yml`
- Modify: `app/models/student.rb` (add `has_many :objective_masteries`)
- Modify: `app/models/learning_objective.rb` (add `has_many :objective_masteries`)

**Step 1: Create the fixture**

`test/fixtures/objective_masteries.yml`:
```yaml
emma_add_fractions:
  student: student_emma
  learning_objective: add_fractions
  exam_mastered: true
  daily_mastered: false
  mastered_at: null
```

**Step 2: Write the failing tests**

`test/models/objective_mastery_test.rb`:
```ruby
require "test_helper"

class ObjectiveMasteryTest < ActiveSupport::TestCase
  test "belongs to student and learning_objective" do
    om = objective_masteries(:emma_add_fractions)
    assert_equal students(:student_emma), om.student
    assert_equal learning_objectives(:add_fractions), om.learning_objective
  end

  test "unique student per learning_objective" do
    existing = objective_masteries(:emma_add_fractions)
    duplicate = ObjectiveMastery.new(student: existing.student, learning_objective: existing.learning_objective)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:student_id], "has already been taken"
  end

  test "mastered? returns true only when both flags are true" do
    om = objective_masteries(:emma_add_fractions)
    assert_not om.mastered?

    om.exam_mastered = true
    om.daily_mastered = true
    om.mastered_at = Time.current
    assert om.mastered?
  end

  test "defaults to not mastered" do
    om = ObjectiveMastery.new
    assert_equal false, om.exam_mastered
    assert_equal false, om.daily_mastered
    assert_nil om.mastered_at
  end
end
```

**Step 3: Run tests to verify they fail**

Run: `bin/rails test test/models/objective_mastery_test.rb`
Expected: FAIL

**Step 4: Create the ObjectiveMastery model**

`app/models/objective_mastery.rb`:
```ruby
class ObjectiveMastery < ApplicationRecord
  belongs_to :student
  belongs_to :learning_objective

  validates :student_id, uniqueness: { scope: :learning_objective_id }

  scope :mastered, -> { where(exam_mastered: true, daily_mastered: true) }
  scope :for_student, ->(student_id) { where(student_id: student_id) }

  def mastered?
    exam_mastered? && daily_mastered?
  end
end
```

**Step 5: Add associations**

In `app/models/student.rb`, add:
```ruby
has_many :objective_masteries, dependent: :destroy
```

In `app/models/learning_objective.rb`, add:
```ruby
has_many :objective_masteries, dependent: :destroy
```

**Step 6: Run tests to verify they pass**

Run: `bin/rails test test/models/objective_mastery_test.rb`
Expected: All PASS

**Step 7: Commit**

```bash
git add -A && git commit -m "feat(exam): add ObjectiveMastery model for tracking student mastery"
```

---

## Phase 3: Pundit Policies

### Task 13: Create Pundit policies for curriculum and exam models

**Files:**
- Create: `app/policies/subject_policy.rb`
- Create: `app/policies/topic_policy.rb`
- Create: `app/policies/learning_objective_policy.rb`
- Create: `app/policies/exam_policy.rb`
- Create: `app/policies/classroom_exam_policy.rb`
- Create: `app/policies/exam_submission_policy.rb`
- Create: `test/policies/subject_policy_test.rb`
- Create: `test/policies/exam_policy_test.rb`
- Modify: `config/initializers/role_permissions.rb` (add curriculum & exam resources)

**Step 1: Update role permissions**

In `config/initializers/role_permissions.rb`, add to teacher and school_manager:

```ruby
module RolePermissions
  DEFAULTS = {
    "teacher" => {
      "classrooms" => %w[index show overview],
      "students" => %w[show radar progress],
      "daily_scores" => %w[index create update],
      "subjects" => %w[index show create update destroy],
      "topics" => %w[index show create update destroy],
      "learning_objectives" => %w[index show create update destroy],
      "exams" => %w[index show create update destroy],
      "classroom_exams" => %w[index show create update],
      "exam_submissions" => %w[index show create update]
    },
    "parent" => {
      "students" => %w[show radar progress],
      "daily_scores" => %w[index],
      "children" => %w[index],
      "subjects" => %w[index show],
      "exams" => %w[index show],
      "exam_submissions" => %w[index show]
    },
    "school_manager" => {
      "classrooms" => %w[index show overview],
      "students" => %w[index show radar progress],
      "daily_scores" => %w[index],
      "feed_posts" => %w[index show create],
      "calendar_events" => %w[index create destroy],
      "teachers" => %w[index show manage],
      "school" => %w[show manage],
      "subjects" => %w[index show create update destroy],
      "topics" => %w[index show create update destroy],
      "learning_objectives" => %w[index show create update destroy],
      "exams" => %w[index show create update destroy],
      "classroom_exams" => %w[index show create update destroy],
      "exam_submissions" => %w[index show]
    },
    "admin" => :all
  }.freeze
end
```

**Step 2: Create SubjectPolicy**

`app/policies/subject_policy.rb`:
```ruby
class SubjectPolicy < ApplicationPolicy
  def index?
    user.has_permission?("subjects", "index")
  end

  def show?
    user.has_permission?("subjects", "show")
  end

  def create?
    user.has_permission?("subjects", "create")
  end

  def update?
    user.has_permission?("subjects", "update")
  end

  def destroy?
    user.has_permission?("subjects", "destroy")
  end
end
```

**Step 3: Create ExamPolicy**

`app/policies/exam_policy.rb`:
```ruby
class ExamPolicy < ApplicationPolicy
  def index?
    user.has_permission?("exams", "index")
  end

  def show?
    user.has_permission?("exams", "show")
  end

  def create?
    user.has_permission?("exams", "create")
  end

  def update?
    user.has_permission?("exams", "update")
  end

  def destroy?
    user.has_permission?("exams", "destroy")
  end
end
```

**Step 4: Create remaining policies** (TopicPolicy, LearningObjectivePolicy, ClassroomExamPolicy, ExamSubmissionPolicy) following the same pattern — each delegates to `has_permission?` with the appropriate resource name.

**Step 5: Write policy tests**

`test/policies/subject_policy_test.rb`:
```ruby
require "test_helper"

class SubjectPolicyTest < ActiveSupport::TestCase
  test "teacher can create subjects" do
    teacher = teachers(:teacher_alice)
    policy = SubjectPolicy.new(teacher, Subject.new)
    assert policy.create?
  end

  test "parent can view but not create subjects" do
    parent = parents(:parent_diana)
    policy = SubjectPolicy.new(parent, Subject.new)
    assert policy.index?
    assert policy.show?
    assert_not policy.create?
  end
end
```

`test/policies/exam_policy_test.rb`:
```ruby
require "test_helper"

class ExamPolicyTest < ActiveSupport::TestCase
  test "teacher can CRUD exams" do
    teacher = teachers(:teacher_alice)
    policy = ExamPolicy.new(teacher, Exam.new)
    assert policy.index?
    assert policy.show?
    assert policy.create?
    assert policy.update?
    assert policy.destroy?
  end

  test "parent can view but not create exams" do
    parent = parents(:parent_diana)
    policy = ExamPolicy.new(parent, Exam.new)
    assert policy.index?
    assert policy.show?
    assert_not policy.create?
  end
end
```

**Step 6: Run all policy tests**

Run: `bin/rails test test/policies/`
Expected: All PASS

**Step 7: Commit**

```bash
git add -A && git commit -m "feat(curriculum): add Pundit policies and role permissions for curriculum & exams"
```

---

## Phase 4: GraphQL Types & Queries

### Task 14: Create GraphQL types for curriculum models

**Files:**
- Create: `app/graphql/types/subject_type.rb`
- Create: `app/graphql/types/topic_type.rb`
- Create: `app/graphql/types/learning_objective_type.rb`
- Create: `app/graphql/types/exam_type_object.rb` (named to avoid conflict with ExamType enum)
- Create: `app/graphql/types/exam_type_enum.rb`
- Create: `app/graphql/types/exam_question_type.rb`
- Create: `app/graphql/types/rubric_criteria_type.rb`
- Create: `app/graphql/types/classroom_exam_type.rb`
- Create: `app/graphql/types/classroom_exam_status_enum.rb`
- Create: `app/graphql/types/exam_submission_type.rb`
- Create: `app/graphql/types/exam_submission_status_enum.rb`
- Create: `app/graphql/types/exam_answer_type.rb`
- Create: `app/graphql/types/rubric_score_type.rb`
- Create: `app/graphql/types/objective_mastery_type.rb`

**Step 1: Create enum types**

`app/graphql/types/exam_type_enum.rb`:
```ruby
module Types
  class ExamTypeEnum < Types::BaseEnum
    value "SCORE_BASED", value: "score_based"
    value "MULTIPLE_CHOICE", value: "multiple_choice"
    value "RUBRIC", value: "rubric"
    value "PASS_FAIL", value: "pass_fail"
  end
end
```

`app/graphql/types/classroom_exam_status_enum.rb`:
```ruby
module Types
  class ClassroomExamStatusEnum < Types::BaseEnum
    value "DRAFT", value: "draft"
    value "ACTIVE", value: "active"
    value "CLOSED", value: "closed"
  end
end
```

`app/graphql/types/exam_submission_status_enum.rb`:
```ruby
module Types
  class ExamSubmissionStatusEnum < Types::BaseEnum
    value "NOT_STARTED", value: "not_started"
    value "IN_PROGRESS", value: "in_progress"
    value "SUBMITTED", value: "submitted"
    value "GRADED", value: "graded"
  end
end
```

**Step 2: Create object types**

`app/graphql/types/subject_type.rb`:
```ruby
module Types
  class SubjectType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String
    field :topics, [Types::TopicType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

`app/graphql/types/topic_type.rb`:
```ruby
module Types
  class TopicType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String
    field :position, Integer, null: false
    field :subject, Types::SubjectType, null: false
    field :learning_objectives, [Types::LearningObjectiveType], null: false
    field :exams, [Types::ExamObjectType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

`app/graphql/types/learning_objective_type.rb`:
```ruby
module Types
  class LearningObjectiveType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String
    field :exam_pass_threshold, Integer, null: false
    field :daily_score_threshold, Integer, null: false
    field :position, Integer, null: false
    field :topic, Types::TopicType, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

`app/graphql/types/exam_object_type.rb`:
```ruby
module Types
  class ExamObjectType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: false
    field :description, String
    field :exam_type, Types::ExamTypeEnum, null: false
    field :max_score, Integer
    field :duration_minutes, Integer
    field :topic, Types::TopicType, null: false
    field :exam_questions, [Types::ExamQuestionType], null: false
    field :rubric_criteria, [Types::RubricCriteriaType], null: false
    field :classroom_exams, [Types::ClassroomExamType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

`app/graphql/types/exam_question_type.rb`:
```ruby
module Types
  class ExamQuestionType < Types::BaseObject
    field :id, ID, null: false
    field :question_text, String, null: false
    field :options, GraphQL::Types::JSON
    field :correct_answer, String, null: false
    field :points, Integer, null: false
    field :position, Integer, null: false
  end
end
```

`app/graphql/types/rubric_criteria_type.rb`:
```ruby
module Types
  class RubricCriteriaType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String
    field :max_score, Integer, null: false
    field :position, Integer, null: false
  end
end
```

`app/graphql/types/classroom_exam_type.rb`:
```ruby
module Types
  class ClassroomExamType < Types::BaseObject
    field :id, ID, null: false
    field :exam, Types::ExamObjectType, null: false
    field :classroom, Types::ClassroomType, null: false
    field :status, Types::ClassroomExamStatusEnum, null: false
    field :scheduled_at, GraphQL::Types::ISO8601DateTime
    field :due_at, GraphQL::Types::ISO8601DateTime
    field :exam_submissions, [Types::ExamSubmissionType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

`app/graphql/types/exam_submission_type.rb`:
```ruby
module Types
  class ExamSubmissionType < Types::BaseObject
    field :id, ID, null: false
    field :student, Types::StudentType, null: false
    field :classroom_exam, Types::ClassroomExamType, null: false
    field :status, Types::ExamSubmissionStatusEnum, null: false
    field :score, Float
    field :passed, Boolean
    field :started_at, GraphQL::Types::ISO8601DateTime
    field :submitted_at, GraphQL::Types::ISO8601DateTime
    field :graded_at, GraphQL::Types::ISO8601DateTime
    field :teacher_notes, String
    field :exam_answers, [Types::ExamAnswerType], null: false
    field :rubric_scores, [Types::RubricScoreType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

`app/graphql/types/exam_answer_type.rb`:
```ruby
module Types
  class ExamAnswerType < Types::BaseObject
    field :id, ID, null: false
    field :exam_question, Types::ExamQuestionType, null: false
    field :selected_answer, String
    field :correct, Boolean
    field :points_awarded, Integer, null: false
  end
end
```

`app/graphql/types/rubric_score_type.rb`:
```ruby
module Types
  class RubricScoreType < Types::BaseObject
    field :id, ID, null: false
    field :rubric_criteria, Types::RubricCriteriaType, null: false
    field :score, Integer, null: false
    field :feedback, String
  end
end
```

`app/graphql/types/objective_mastery_type.rb`:
```ruby
module Types
  class ObjectiveMasteryType < Types::BaseObject
    field :id, ID, null: false
    field :student, Types::StudentType, null: false
    field :learning_objective, Types::LearningObjectiveType, null: false
    field :exam_mastered, Boolean, null: false
    field :daily_mastered, Boolean, null: false
    field :mastered, Boolean, null: false
    field :mastered_at, GraphQL::Types::ISO8601DateTime

    def mastered
      object.mastered?
    end
  end
end
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(curriculum): add all GraphQL types for curriculum and exam system"
```

---

### Task 15: Add GraphQL queries for curriculum and exams

**Files:**
- Modify: `app/graphql/types/query_type.rb`

**Step 1: Add curriculum queries to QueryType**

Add these fields to `app/graphql/types/query_type.rb`:

```ruby
# Curriculum
field :subjects, [Types::SubjectType], null: false, description: "List subjects for a school" do
  argument :school_id, ID, required: true
end

field :subject, Types::SubjectType, description: "Get a subject with topics and objectives" do
  argument :id, ID, required: true
end

field :topic, Types::TopicType, description: "Get a topic with objectives and exams" do
  argument :id, ID, required: true
end

# Exams
field :exam, Types::ExamObjectType, description: "Get an exam with questions/criteria" do
  argument :id, ID, required: true
end

field :classroom_exams, [Types::ClassroomExamType], null: false, description: "List exams for a classroom" do
  argument :classroom_id, ID, required: true
  argument :status, Types::ClassroomExamStatusEnum, required: false
end

field :exam_submission, Types::ExamSubmissionType, description: "Get an exam submission" do
  argument :id, ID, required: true
end

field :student_masteries, [Types::ObjectiveMasteryType], null: false, description: "Get mastery status for a student" do
  argument :student_id, ID, required: true
  argument :subject_id, ID, required: false
end
```

**Step 2: Implement resolvers**

```ruby
def subjects(school_id:)
  authenticate!
  school = School.find(school_id)
  raise Pundit::NotAuthorizedError unless SubjectPolicy.new(current_user, Subject.new).index?
  school.subjects
end

def subject(id:)
  authenticate!
  subject = Subject.find(id)
  raise Pundit::NotAuthorizedError unless SubjectPolicy.new(current_user, subject).show?
  subject
end

def topic(id:)
  authenticate!
  topic = Topic.find(id)
  raise Pundit::NotAuthorizedError unless SubjectPolicy.new(current_user, topic.subject).show?
  topic
end

def exam(id:)
  authenticate!
  exam = Exam.find(id)
  raise Pundit::NotAuthorizedError unless ExamPolicy.new(current_user, exam).show?
  exam
end

def classroom_exams(classroom_id:, status: nil)
  authenticate!
  classroom = Classroom.find(classroom_id)
  scope = classroom.classroom_exams.includes(:exam)
  scope = scope.where(status: status) if status
  scope
end

def exam_submission(id:)
  authenticate!
  submission = ExamSubmission.find(id)
  raise Pundit::NotAuthorizedError unless ExamSubmissionPolicy.new(current_user, submission).show?
  submission
end

def student_masteries(student_id:, subject_id: nil)
  authenticate!
  student = Student.find(student_id)
  raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?

  scope = student.objective_masteries.includes(learning_objective: { topic: :subject })
  if subject_id
    scope = scope.joins(learning_objective: { topic: :subject }).where(subjects: { id: subject_id })
  end
  scope
end
```

**Step 3: Run full test suite**

Run: `bin/rails test`
Expected: All existing tests still pass

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(curriculum): add GraphQL queries for subjects, topics, exams, and mastery"
```

---

## Phase 5: GraphQL Mutations

### Task 16: Create curriculum CRUD mutations

**Files:**
- Create: `app/graphql/mutations/create_subject.rb`
- Create: `app/graphql/mutations/update_subject.rb`
- Create: `app/graphql/mutations/delete_subject.rb`
- Create: `app/graphql/mutations/create_topic.rb`
- Create: `app/graphql/mutations/update_topic.rb`
- Create: `app/graphql/mutations/delete_topic.rb`
- Create: `app/graphql/mutations/create_learning_objective.rb`
- Create: `app/graphql/mutations/update_learning_objective.rb`
- Create: `app/graphql/mutations/delete_learning_objective.rb`
- Create: `app/graphql/types/create_subject_input_type.rb`
- Create: `app/graphql/types/update_subject_input_type.rb`
- Create: `app/graphql/types/create_topic_input_type.rb`
- Create: `app/graphql/types/update_topic_input_type.rb`
- Create: `app/graphql/types/create_learning_objective_input_type.rb`
- Create: `app/graphql/types/update_learning_objective_input_type.rb`
- Modify: `app/graphql/types/mutation_type.rb`

**Step 1: Create input types**

`app/graphql/types/create_subject_input_type.rb`:
```ruby
module Types
  class CreateSubjectInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :description, String, required: false
    argument :school_id, ID, required: true
  end
end
```

`app/graphql/types/update_subject_input_type.rb`:
```ruby
module Types
  class UpdateSubjectInputType < Types::BaseInputObject
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :description, String, required: false
  end
end
```

`app/graphql/types/create_topic_input_type.rb`:
```ruby
module Types
  class CreateTopicInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :description, String, required: false
    argument :subject_id, ID, required: true
    argument :position, Integer, required: false
  end
end
```

`app/graphql/types/update_topic_input_type.rb`:
```ruby
module Types
  class UpdateTopicInputType < Types::BaseInputObject
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :description, String, required: false
    argument :position, Integer, required: false
  end
end
```

`app/graphql/types/create_learning_objective_input_type.rb`:
```ruby
module Types
  class CreateLearningObjectiveInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :description, String, required: false
    argument :topic_id, ID, required: true
    argument :exam_pass_threshold, Integer, required: false
    argument :daily_score_threshold, Integer, required: false
    argument :position, Integer, required: false
  end
end
```

`app/graphql/types/update_learning_objective_input_type.rb`:
```ruby
module Types
  class UpdateLearningObjectiveInputType < Types::BaseInputObject
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :description, String, required: false
    argument :exam_pass_threshold, Integer, required: false
    argument :daily_score_threshold, Integer, required: false
    argument :position, Integer, required: false
  end
end
```

**Step 2: Create mutations**

`app/graphql/mutations/create_subject.rb`:
```ruby
module Mutations
  class CreateSubject < BaseMutation
    argument :input, Types::CreateSubjectInputType, required: true

    field :subject, Types::SubjectType
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless SubjectPolicy.new(current_user, Subject.new).create?

      subject = Subject.new(input.to_h)
      if subject.save
        { subject: subject, errors: [] }
      else
        { subject: nil, errors: subject.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } } }
      end
    end
  end
end
```

`app/graphql/mutations/update_subject.rb`:
```ruby
module Mutations
  class UpdateSubject < BaseMutation
    argument :input, Types::UpdateSubjectInputType, required: true

    field :subject, Types::SubjectType
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      authenticate!
      subject = Subject.find(input.id)
      raise Pundit::NotAuthorizedError unless SubjectPolicy.new(current_user, subject).update?

      if subject.update(input.to_h.except(:id))
        { subject: subject, errors: [] }
      else
        { subject: nil, errors: subject.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } } }
      end
    end
  end
end
```

`app/graphql/mutations/delete_subject.rb`:
```ruby
module Mutations
  class DeleteSubject < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [Types::UserErrorType], null: false

    def resolve(id:)
      authenticate!
      subject = Subject.find(id)
      raise Pundit::NotAuthorizedError unless SubjectPolicy.new(current_user, subject).destroy?

      subject.destroy!
      { success: true, errors: [] }
    end
  end
end
```

Create the same pattern for Topic and LearningObjective mutations (CreateTopic, UpdateTopic, DeleteTopic, CreateLearningObjective, UpdateLearningObjective, DeleteLearningObjective) — each follows the identical pattern with the appropriate model, policy, and input type.

**Step 3: Register mutations in MutationType**

Add to `app/graphql/types/mutation_type.rb`:
```ruby
# Curriculum
field :create_subject, mutation: Mutations::CreateSubject
field :update_subject, mutation: Mutations::UpdateSubject
field :delete_subject, mutation: Mutations::DeleteSubject
field :create_topic, mutation: Mutations::CreateTopic
field :update_topic, mutation: Mutations::UpdateTopic
field :delete_topic, mutation: Mutations::DeleteTopic
field :create_learning_objective, mutation: Mutations::CreateLearningObjective
field :update_learning_objective, mutation: Mutations::UpdateLearningObjective
field :delete_learning_objective, mutation: Mutations::DeleteLearningObjective
```

**Step 4: Run full test suite**

Run: `bin/rails test`
Expected: All PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(curriculum): add GraphQL CRUD mutations for subjects, topics, and objectives"
```

---

### Task 17: Create exam CRUD mutations

**Files:**
- Create: `app/graphql/mutations/create_exam.rb`
- Create: `app/graphql/mutations/assign_exam_to_classroom.rb`
- Create: `app/graphql/mutations/grade_exam_submission.rb`
- Create: `app/graphql/mutations/submit_exam_answers.rb`
- Create: `app/graphql/types/create_exam_input_type.rb`
- Create: `app/graphql/types/assign_exam_input_type.rb`
- Create: `app/graphql/types/grade_submission_input_type.rb`
- Create: `app/graphql/types/submit_answers_input_type.rb`
- Modify: `app/graphql/types/mutation_type.rb`

**Step 1: Create input types**

`app/graphql/types/create_exam_input_type.rb`:
```ruby
module Types
  class CreateExamInputType < Types::BaseInputObject
    argument :title, String, required: true
    argument :description, String, required: false
    argument :exam_type, Types::ExamTypeEnum, required: true
    argument :topic_id, ID, required: true
    argument :max_score, Integer, required: false
    argument :duration_minutes, Integer, required: false
    argument :questions, [Types::ExamQuestionInputType], required: false
    argument :rubric_criteria, [Types::RubricCriteriaInputType], required: false
  end
end
```

`app/graphql/types/exam_question_input_type.rb`:
```ruby
module Types
  class ExamQuestionInputType < Types::BaseInputObject
    argument :question_text, String, required: true
    argument :options, GraphQL::Types::JSON, required: false
    argument :correct_answer, String, required: true
    argument :points, Integer, required: false
    argument :position, Integer, required: false
  end
end
```

`app/graphql/types/rubric_criteria_input_type.rb`:
```ruby
module Types
  class RubricCriteriaInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :description, String, required: false
    argument :max_score, Integer, required: false
    argument :position, Integer, required: false
  end
end
```

`app/graphql/types/assign_exam_input_type.rb`:
```ruby
module Types
  class AssignExamInputType < Types::BaseInputObject
    argument :exam_id, ID, required: true
    argument :classroom_id, ID, required: true
    argument :scheduled_at, GraphQL::Types::ISO8601DateTime, required: false
    argument :due_at, GraphQL::Types::ISO8601DateTime, required: false
  end
end
```

`app/graphql/types/submit_answers_input_type.rb`:
```ruby
module Types
  class SubmitAnswersInputType < Types::BaseInputObject
    argument :classroom_exam_id, ID, required: true
    argument :answers, [Types::AnswerInputType], required: true
  end
end
```

`app/graphql/types/answer_input_type.rb`:
```ruby
module Types
  class AnswerInputType < Types::BaseInputObject
    argument :exam_question_id, ID, required: true
    argument :selected_answer, String, required: true
  end
end
```

`app/graphql/types/grade_submission_input_type.rb`:
```ruby
module Types
  class GradeSubmissionInputType < Types::BaseInputObject
    argument :exam_submission_id, ID, required: true
    argument :score, Float, required: false
    argument :passed, Boolean, required: false
    argument :teacher_notes, String, required: false
    argument :rubric_scores, [Types::RubricScoreInputType], required: false
  end
end
```

`app/graphql/types/rubric_score_input_type.rb`:
```ruby
module Types
  class RubricScoreInputType < Types::BaseInputObject
    argument :rubric_criteria_id, ID, required: true
    argument :score, Integer, required: true
    argument :feedback, String, required: false
  end
end
```

**Step 2: Create mutations**

`app/graphql/mutations/create_exam.rb`:
```ruby
module Mutations
  class CreateExam < BaseMutation
    argument :input, Types::CreateExamInputType, required: true

    field :exam, Types::ExamObjectType
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless ExamPolicy.new(current_user, Exam.new).create?

      attrs = input.to_h.except(:questions, :rubric_criteria)
      exam = Exam.new(attrs)
      exam.created_by = current_user

      ActiveRecord::Base.transaction do
        exam.save!

        if input.questions.present?
          input.questions.each_with_index do |q, i|
            exam.exam_questions.create!(q.to_h.merge(position: q.position || i))
          end
        end

        if input.rubric_criteria.present?
          input.rubric_criteria.each_with_index do |rc, i|
            exam.rubric_criteria.create!(rc.to_h.merge(position: rc.position || i))
          end
        end
      end

      { exam: exam, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { exam: nil, errors: e.record.errors.map { |err| { message: err.full_message, path: [err.attribute.to_s.camelize(:lower)] } } }
    end
  end
end
```

`app/graphql/mutations/assign_exam_to_classroom.rb`:
```ruby
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
        { classroom_exam: classroom_exam, errors: [] }
      else
        { classroom_exam: nil, errors: classroom_exam.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } } }
      end
    end
  end
end
```

`app/graphql/mutations/submit_exam_answers.rb`:
```ruby
module Mutations
  class SubmitExamAnswers < BaseMutation
    argument :input, Types::SubmitAnswersInputType, required: true

    field :exam_submission, Types::ExamSubmissionType
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      authenticate!
      classroom_exam = ClassroomExam.find(input.classroom_exam_id)
      exam = classroom_exam.exam

      # Find or create submission
      submission = ExamSubmission.find_or_initialize_by(
        student: current_user, # Only students submit (future: add student role)
        classroom_exam: classroom_exam
      )

      ActiveRecord::Base.transaction do
        submission.status = :submitted
        submission.submitted_at = Time.current
        submission.save!

        # Auto-grade MC answers
        if exam.multiple_choice?
          total_points = 0
          earned_points = 0

          input.answers.each do |answer_input|
            question = exam.exam_questions.find(answer_input.exam_question_id)
            correct = question.correct_answer == answer_input.selected_answer
            points = correct ? question.points : 0

            submission.exam_answers.create!(
              exam_question: question,
              selected_answer: answer_input.selected_answer,
              correct: correct,
              points_awarded: points
            )

            total_points += question.points
            earned_points += points
          end

          # Calculate percentage score
          submission.score = total_points > 0 ? (earned_points.to_f / total_points * 100).round(2) : 0
          submission.passed = submission.score >= classroom_exam.exam.topic.learning_objectives.first&.exam_pass_threshold.to_i
          submission.status = :graded
          submission.graded_at = Time.current
          submission.save!
        end
      end

      { exam_submission: submission, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { exam_submission: nil, errors: e.record.errors.map { |err| { message: err.full_message, path: [err.attribute.to_s.camelize(:lower)] } } }
    end
  end
end
```

`app/graphql/mutations/grade_exam_submission.rb`:
```ruby
module Mutations
  class GradeExamSubmission < BaseMutation
    argument :input, Types::GradeSubmissionInputType, required: true

    field :exam_submission, Types::ExamSubmissionType
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      authenticate!
      submission = ExamSubmission.find(input.exam_submission_id)
      raise Pundit::NotAuthorizedError unless ExamSubmissionPolicy.new(current_user, submission).update?

      ActiveRecord::Base.transaction do
        # Handle rubric scoring
        if input.rubric_scores.present?
          total_max = 0
          total_earned = 0

          input.rubric_scores.each do |rs_input|
            criteria = RubricCriteria.find(rs_input.rubric_criteria_id)
            submission.rubric_scores.create!(
              rubric_criteria: criteria,
              score: rs_input.score,
              feedback: rs_input.feedback
            )
            total_max += criteria.max_score
            total_earned += rs_input.score
          end

          submission.score = total_max > 0 ? (total_earned.to_f / total_max * 100).round(2) : 0
        elsif input.score.present?
          submission.score = input.score
        end

        submission.passed = input.passed unless input.passed.nil?
        submission.teacher_notes = input.teacher_notes if input.teacher_notes.present?
        submission.status = :graded
        submission.graded_at = Time.current
        submission.save!
      end

      { exam_submission: submission, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { exam_submission: nil, errors: e.record.errors.map { |err| { message: err.full_message, path: [err.attribute.to_s.camelize(:lower)] } } }
    end
  end
end
```

**Step 3: Register mutations in MutationType**

Add to `app/graphql/types/mutation_type.rb`:
```ruby
# Exams
field :create_exam, mutation: Mutations::CreateExam
field :assign_exam_to_classroom, mutation: Mutations::AssignExamToClassroom
field :submit_exam_answers, mutation: Mutations::SubmitExamAnswers
field :grade_exam_submission, mutation: Mutations::GradeExamSubmission
```

**Step 4: Run full test suite**

Run: `bin/rails test`
Expected: All PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(exam): add GraphQL mutations for exam creation, assignment, submission, and grading"
```

---

## Phase 6: Mastery Evaluation Service

### Task 18: Create MasteryEvaluationService

**Files:**
- Create: `app/services/mastery_evaluation_service.rb`
- Create: `test/services/mastery_evaluation_service_test.rb`

**Step 1: Write the failing tests**

`test/services/mastery_evaluation_service_test.rb`:
```ruby
require "test_helper"

class MasteryEvaluationServiceTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_emma)
    @objective = learning_objectives(:add_fractions)
  end

  test "marks exam_mastered when submission score meets threshold" do
    # Create a graded submission with passing score
    ce = classroom_exams(:alice_fractions_quiz)
    ExamSubmission.create!(
      student: @student,
      classroom_exam: ce,
      status: :graded,
      score: 85.0,
      passed: true,
      graded_at: Time.current
    )

    MasteryEvaluationService.evaluate(@student, @objective)

    mastery = ObjectiveMastery.find_by(student: @student, learning_objective: @objective)
    assert mastery.exam_mastered
  end

  test "does not mark exam_mastered when score below threshold" do
    ce = classroom_exams(:alice_fractions_quiz)
    ExamSubmission.create!(
      student: @student,
      classroom_exam: ce,
      status: :graded,
      score: 50.0,
      passed: false,
      graded_at: Time.current
    )

    MasteryEvaluationService.evaluate(@student, @objective)

    mastery = ObjectiveMastery.find_by(student: @student, learning_objective: @objective)
    assert_not mastery.exam_mastered
  end

  test "sets mastered_at when both flags are true" do
    mastery = ObjectiveMastery.find_or_create_by!(student: @student, learning_objective: @objective)
    mastery.update!(exam_mastered: true, daily_mastered: false)

    # Simulate daily mastery being met
    mastery.update!(daily_mastered: true)
    MasteryEvaluationService.evaluate(@student, @objective)

    mastery.reload
    assert mastery.mastered?
    assert_not_nil mastery.mastered_at
  end
end
```

**Step 2: Run tests to verify they fail**

Run: `bin/rails test test/services/mastery_evaluation_service_test.rb`
Expected: FAIL

**Step 3: Create the service**

`app/services/mastery_evaluation_service.rb`:
```ruby
class MasteryEvaluationService
  def self.evaluate(student, learning_objective)
    new(student, learning_objective).evaluate
  end

  def initialize(student, learning_objective)
    @student = student
    @objective = learning_objective
  end

  def evaluate
    mastery = ObjectiveMastery.find_or_create_by!(
      student: @student,
      learning_objective: @objective
    )

    mastery.exam_mastered = exam_mastered?
    mastery.daily_mastered = daily_mastered?

    if mastery.mastered? && mastery.mastered_at.nil?
      mastery.mastered_at = Time.current
    elsif !mastery.mastered?
      mastery.mastered_at = nil
    end

    mastery.save!
    mastery
  end

  private

  def exam_mastered?
    # Find all exams for this objective's topic
    topic = @objective.topic
    classroom_exam_ids = ClassroomExam.joins(:exam).where(exams: { topic_id: topic.id }).pluck(:id)

    return false if classroom_exam_ids.empty?

    # Check if any graded submission meets the threshold
    best_score = ExamSubmission
      .where(student: @student, classroom_exam_id: classroom_exam_ids, status: :graded)
      .maximum(:score)

    return false if best_score.nil?

    best_score >= @objective.exam_pass_threshold
  end

  def daily_mastered?
    # DailyScore is separate — we check if the student's overall daily average
    # meets the threshold. Since DailyScore uses skill_category (not curriculum subjects),
    # we check the overall average across all skills.
    avg = @student.daily_scores.average(:score)
    return false if avg.nil?

    avg >= @objective.daily_score_threshold
  end
end
```

**Step 4: Run tests to verify they pass**

Run: `bin/rails test test/services/mastery_evaluation_service_test.rb`
Expected: All PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(mastery): add MasteryEvaluationService for combined exam + daily score evaluation"
```

---

### Task 19: Wire mastery evaluation into grading flow

**Files:**
- Modify: `app/graphql/mutations/grade_exam_submission.rb`
- Create: `app/jobs/evaluate_mastery_job.rb`

**Step 1: Create the background job**

`app/jobs/evaluate_mastery_job.rb`:
```ruby
class EvaluateMasteryJob < ApplicationJob
  queue_as :default

  def perform(student_id, topic_id)
    student = Student.find(student_id)
    topic = Topic.find(topic_id)

    topic.learning_objectives.each do |objective|
      MasteryEvaluationService.evaluate(student, objective)
    end
  end
end
```

**Step 2: Trigger mastery evaluation after grading**

In `app/graphql/mutations/grade_exam_submission.rb`, add after `submission.save!`:

```ruby
# Trigger mastery evaluation
topic = submission.classroom_exam.exam.topic
EvaluateMasteryJob.perform_later(submission.student_id, topic.id)
```

Also add the same trigger at the end of `submit_exam_answers.rb` after auto-grading MC exams.

**Step 3: Run full test suite**

Run: `bin/rails test`
Expected: All PASS

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(mastery): trigger mastery evaluation after exam grading via background job"
```

---

## Phase 7: Integration Tests

### Task 20: Write GraphQL integration tests for curriculum and exam flow

**Files:**
- Create: `test/graphql/mutations/create_subject_test.rb`
- Create: `test/graphql/mutations/create_exam_test.rb`
- Create: `test/graphql/mutations/grade_exam_submission_test.rb`
- Create: `test/graphql/queries/subjects_test.rb`

**Step 1: Write subject mutation test**

`test/graphql/mutations/create_subject_test.rb`:
```ruby
require "test_helper"

class CreateSubjectMutationTest < ActiveSupport::TestCase
  include AuthTestHelper

  MUTATION = <<~GQL
    mutation($input: CreateSubjectInput!) {
      createSubject(input: { input: $input }) {
        subject { id name description }
        errors { message path }
      }
    }
  GQL

  test "teacher can create a subject" do
    teacher = teachers(:teacher_alice)
    result = GrewmeSchema.execute(MUTATION, variables: {
      input: { name: "Science", description: "Natural sciences", schoolId: schools(:greenwood).id.to_s }
    }, context: { current_user: teacher })

    data = result["data"]["createSubject"]
    assert_empty data["errors"]
    assert_equal "Science", data["subject"]["name"]
  end

  test "returns errors for duplicate name in same school" do
    teacher = teachers(:teacher_alice)
    result = GrewmeSchema.execute(MUTATION, variables: {
      input: { name: "Mathematics", schoolId: schools(:greenwood).id.to_s }
    }, context: { current_user: teacher })

    data = result["data"]["createSubject"]
    assert_not_empty data["errors"]
  end
end
```

**Step 2: Write exam creation test**

`test/graphql/mutations/create_exam_test.rb`:
```ruby
require "test_helper"

class CreateExamMutationTest < ActiveSupport::TestCase
  include AuthTestHelper

  MUTATION = <<~GQL
    mutation($input: CreateExamInput!) {
      createExam(input: { input: $input }) {
        exam { id title examType examQuestions { id questionText correctAnswer } }
        errors { message path }
      }
    }
  GQL

  test "teacher can create MC exam with questions" do
    teacher = teachers(:teacher_alice)
    result = GrewmeSchema.execute(MUTATION, variables: {
      input: {
        title: "Algebra Quiz",
        examType: "MULTIPLE_CHOICE",
        topicId: topics(:algebra).id.to_s,
        maxScore: 10,
        questions: [
          { questionText: "What is x if 2x = 4?", correctAnswer: "2", points: 5 },
          { questionText: "What is x if x + 3 = 7?", correctAnswer: "4", points: 5 }
        ]
      }
    }, context: { current_user: teacher })

    data = result["data"]["createExam"]
    assert_empty data["errors"]
    assert_equal "Algebra Quiz", data["exam"]["title"]
    assert_equal 2, data["exam"]["examQuestions"].size
  end
end
```

**Step 3: Write subjects query test**

`test/graphql/queries/subjects_test.rb`:
```ruby
require "test_helper"

class SubjectsQueryTest < ActiveSupport::TestCase
  include AuthTestHelper

  QUERY = <<~GQL
    query($schoolId: ID!) {
      subjects(schoolId: $schoolId) {
        id name topics { id name learningObjectives { id name examPassThreshold } }
      }
    }
  GQL

  test "returns subjects with nested topics and objectives" do
    teacher = teachers(:teacher_alice)
    result = GrewmeSchema.execute(QUERY, variables: {
      schoolId: schools(:greenwood).id.to_s
    }, context: { current_user: teacher })

    subjects = result["data"]["subjects"]
    assert subjects.any? { |s| s["name"] == "Mathematics" }

    math = subjects.find { |s| s["name"] == "Mathematics" }
    assert math["topics"].any? { |t| t["name"] == "Fractions" }
  end
end
```

**Step 4: Run all tests**

Run: `bin/rails test`
Expected: All PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "test(curriculum): add GraphQL integration tests for curriculum and exam mutations"
```

---

## Phase 8: Final Verification & Cleanup

### Task 21: Run full test suite and verify

**Step 1: Run all tests**

Run: `bin/rails test`
Expected: All PASS, 0 failures

**Step 2: Check for any missing associations or N+1 queries**

Review all GraphQL types for eager loading opportunities. Add `includes` to queries where needed.

**Step 3: Final commit**

```bash
git add -A && git commit -m "chore(curriculum): final cleanup and verification"
```

---

## Summary

| Phase | Tasks | Models/Files |
|-------|-------|-------------|
| 1. Curriculum Models | 1-4 | Subject, Topic, LearningObjective + migration, tests, fixtures |
| 2. Exam Models | 5-12 | Exam, ExamQuestion, RubricCriteria, ClassroomExam, ExamSubmission, ExamAnswer, RubricScore, ObjectiveMastery |
| 3. Pundit Policies | 13 | 6 policies + role permissions update |
| 4. GraphQL Types & Queries | 14-15 | 14 types + 7 queries |
| 5. GraphQL Mutations | 16-17 | 13 mutations + 10 input types |
| 6. Mastery Service | 18-19 | MasteryEvaluationService + EvaluateMasteryJob |
| 7. Integration Tests | 20 | 4 test files |
| 8. Verification | 21 | Cleanup |

**Total: 21 tasks across 8 phases**
