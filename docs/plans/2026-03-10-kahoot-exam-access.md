# Kahoot-style Exam Access Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let students take exams via a shareable 6-character code — no login required. Kahoot-style: enter code → pick name → take exam with timer → auto-submit.

**Architecture:** Add `access_code` to ClassroomExam (auto-generated on create). New unauthenticated GraphQL queries/mutations for exam session management. Standalone `/exam/[code]` SvelteKit route with minimal UI. Server-side timer with SolidQueue background job for auto-submit.

**Tech Stack:** Rails 8 (backend), SvelteKit + Svelte 5 runes (frontend), SolidQueue (background jobs), GraphQL (API)

**Design doc:** `docs/plans/2026-03-10-kahoot-style-exam-access-design.md`

---

## Phase 1: Database & Models (Tasks 1–4)

### Task 1: Migration — Add exam access columns

**Files:**
- Create: `backend/db/migrate/XXXXXX_add_kahoot_exam_access.rb`

**Step 1: Generate migration**

```bash
cd backend && bin/rails generate migration AddKahootExamAccess
```

**Step 2: Write migration**

```ruby
class AddKahootExamAccess < ActiveRecord::Migration[8.0]
  def change
    safety_assured do
      # ClassroomExam: access code + exam settings
      add_column :classroom_exams, :access_code, :string, limit: 6
      add_column :classroom_exams, :duration_minutes, :integer
      add_column :classroom_exams, :show_results, :boolean, default: false, null: false

      add_index :classroom_exams, :access_code, unique: true

      # ExamSubmission: session tracking
      add_column :exam_submissions, :started_at, :datetime
      add_column :exam_submissions, :auto_submitted, :boolean, default: false, null: false
      add_column :exam_submissions, :session_token, :string

      add_index :exam_submissions, :session_token, unique: true
    end
  end
end
```

Note: `exam_submissions` already has `submitted_at` (used in fixtures). No need to add it.

**Step 3: Run migration**

```bash
bin/rails db:migrate
```

**Step 4: Commit**

```bash
git add db/migrate/ db/schema.rb
git commit -m "feat: add kahoot exam access columns (access_code, duration, session_token)"
```

---

### Task 2: AccessCodeGenerator concern

**Files:**
- Create: `backend/app/models/concerns/access_code_generator.rb`
- Test: `backend/test/models/concerns/access_code_generator_test.rb`

**Step 1: Write the failing test**

```ruby
# backend/test/models/concerns/access_code_generator_test.rb
require "test_helper"

class AccessCodeGeneratorTest < ActiveSupport::TestCase
  test "generates a 6-character alphanumeric code" do
    code = AccessCodeGenerator.generate
    assert_equal 6, code.length
    assert_match(/\A[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}\z/, code)
  end

  test "excludes ambiguous characters" do
    100.times do
      code = AccessCodeGenerator.generate
      refute_match(/[0OoIil1L]/, code)
    end
  end
end
```

**Step 2: Run test to verify it fails**

```bash
bin/rails test test/models/concerns/access_code_generator_test.rb
```

Expected: NameError — `AccessCodeGenerator` not defined.

**Step 3: Write implementation**

```ruby
# backend/app/models/concerns/access_code_generator.rb
module AccessCodeGenerator
  CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".chars.freeze

  def self.generate(length: 6)
    Array.new(length) { CHARSET.sample }.join
  end
end
```

**Step 4: Run test to verify it passes**

```bash
bin/rails test test/models/concerns/access_code_generator_test.rb
```

**Step 5: Commit**

```bash
git add app/models/concerns/access_code_generator.rb test/models/concerns/access_code_generator_test.rb
git commit -m "feat: add AccessCodeGenerator for 6-char exam codes"
```

---

### Task 3: Update ClassroomExam model

**Files:**
- Modify: `backend/app/models/classroom_exam.rb`
- Test: `backend/test/models/classroom_exam_test.rb`

**Step 1: Write failing tests**

```ruby
# backend/test/models/classroom_exam_test.rb
require "test_helper"

class ClassroomExamTest < ActiveSupport::TestCase
  test "auto-generates access_code before create" do
    exam = ClassroomExam.create!(
      exam: exams(:fractions_mc_exam),
      classroom: classrooms(:alice_class),
      assigned_by: teachers(:teacher_alice)
    )
    assert_present exam.access_code
    assert_equal 6, exam.access_code.length
  end

  test "access_code is unique" do
    existing = classroom_exams(:alice_mc_exam)
    existing.update!(access_code: "ABC123")

    new_exam = ClassroomExam.new(
      exam: exams(:fractions_score_exam),
      classroom: classrooms(:bob_class),
      assigned_by: teachers(:teacher_bob),
      access_code: "ABC123"
    )
    assert_not new_exam.valid?
  end

  test "find_by_access_code scope" do
    existing = classroom_exams(:alice_mc_exam)
    existing.update!(access_code: "XYZ789")

    found = ClassroomExam.find_by(access_code: "XYZ789")
    assert_equal existing, found
  end

  test "duration_minutes is optional" do
    exam = classroom_exams(:alice_mc_exam)
    exam.duration_minutes = nil
    assert exam.valid?
  end

  test "duration_minutes must be positive if set" do
    exam = classroom_exams(:alice_mc_exam)
    exam.duration_minutes = 0
    assert_not exam.valid?

    exam.duration_minutes = 30
    assert exam.valid?
  end
end
```

**Step 2: Run test to verify failures**

```bash
bin/rails test test/models/classroom_exam_test.rb
```

**Step 3: Update model**

The current `backend/app/models/classroom_exam.rb` is:
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

Add after the enum line:

```ruby
  before_create :generate_access_code

  validates :access_code, uniqueness: true, allow_nil: true
  validates :duration_minutes, numericality: { greater_than: 0 }, allow_nil: true

  private

  def generate_access_code
    loop do
      self.access_code = AccessCodeGenerator.generate
      break unless ClassroomExam.exists?(access_code: access_code)
    end
  end
```

Also update fixtures to include access_code:
```yaml
# backend/test/fixtures/classroom_exams.yml
alice_fractions_quiz:
  exam: fractions_score_exam
  classroom: alice_class
  assigned_by_type: Teacher
  assigned_by_id: <%= ActiveRecord::FixtureSet.identify(:teacher_alice) %>
  status: 0
  access_code: FRKQ2M
  scheduled_at: <%= Time.zone.parse("2026-03-10 09:00:00") %>
  due_at: <%= Time.zone.parse("2026-03-10 10:00:00") %>

alice_mc_exam:
  exam: fractions_mc_exam
  classroom: alice_class
  assigned_by_type: Teacher
  assigned_by_id: <%= ActiveRecord::FixtureSet.identify(:teacher_alice) %>
  status: 0
  access_code: MCX7BN
```

**Step 4: Run tests**

```bash
bin/rails test test/models/classroom_exam_test.rb
```

**Step 5: Commit**

```bash
git add app/models/classroom_exam.rb test/models/classroom_exam_test.rb test/fixtures/classroom_exams.yml
git commit -m "feat: auto-generate access_code on ClassroomExam create"
```

---

### Task 4: Update ExamSubmission model (session support)

**Files:**
- Modify: `backend/app/models/exam_submission.rb`
- Test: `backend/test/models/exam_submission_test.rb`

**Step 1: Write failing tests**

```ruby
# backend/test/models/exam_submission_test.rb
require "test_helper"

class ExamSubmissionTest < ActiveSupport::TestCase
  test "generates session_token before create" do
    submission = ExamSubmission.create!(
      student: students(:student_finn),
      classroom_exam: classroom_exams(:alice_mc_exam),
      status: :in_progress,
      started_at: Time.current
    )
    assert_present submission.session_token
  end

  test "session_token is unique" do
    existing = exam_submissions(:emma_fractions_quiz)
    existing.update!(session_token: "test-token-123")

    new_sub = ExamSubmission.new(
      student: students(:student_finn),
      classroom_exam: classroom_exams(:alice_mc_exam),
      session_token: "test-token-123"
    )
    assert_not new_sub.valid?
  end

  test "time_remaining returns seconds left" do
    sub = exam_submissions(:emma_fractions_quiz)
    sub.started_at = 10.minutes.ago
    sub.classroom_exam.duration_minutes = 30

    remaining = sub.time_remaining
    assert_in_delta 1200, remaining, 2  # ~20 min = 1200 sec
  end

  test "time_remaining returns nil when no duration set" do
    sub = exam_submissions(:emma_fractions_quiz)
    sub.started_at = 10.minutes.ago
    sub.classroom_exam.duration_minutes = nil

    assert_nil sub.time_remaining
  end

  test "time_expired? returns true when time is up" do
    sub = exam_submissions(:emma_fractions_quiz)
    sub.started_at = 35.minutes.ago
    sub.classroom_exam.duration_minutes = 30

    assert sub.time_expired?
  end

  test "time_expired? returns false when no duration" do
    sub = exam_submissions(:emma_fractions_quiz)
    sub.classroom_exam.duration_minutes = nil

    assert_not sub.time_expired?
  end
end
```

**Step 2: Run test to verify failures**

```bash
bin/rails test test/models/exam_submission_test.rb
```

**Step 3: Update model**

Current `backend/app/models/exam_submission.rb` — add after `enum :status`:

```ruby
  before_create :generate_session_token

  validates :session_token, uniqueness: true, allow_nil: true

  def time_remaining
    return nil unless classroom_exam.duration_minutes && started_at
    deadline = started_at + classroom_exam.duration_minutes.minutes
    remaining = (deadline - Time.current).to_i
    [ remaining, 0 ].max
  end

  def time_expired?
    return false unless classroom_exam.duration_minutes && started_at
    time_remaining == 0
  end

  private

  def generate_session_token
    self.session_token ||= SecureRandom.urlsafe_base64(32)
  end
```

Update fixture to include session_token:
```yaml
# backend/test/fixtures/exam_submissions.yml
emma_fractions_quiz:
  student: student_emma
  classroom_exam: alice_fractions_quiz
  status: 2
  score: 85.00
  passed: true
  session_token: emma-test-session-token-abc
  started_at: <%= Time.zone.parse("2026-03-10 09:15:00") %>
  submitted_at: <%= Time.zone.parse("2026-03-10 09:45:00") %>
  graded_at: <%= Time.zone.parse("2026-03-10 10:00:00") %>
```

**Step 4: Run tests**

```bash
bin/rails test test/models/exam_submission_test.rb
```

**Step 5: Commit**

```bash
git add app/models/exam_submission.rb test/models/exam_submission_test.rb test/fixtures/exam_submissions.yml
git commit -m "feat: add session_token + time helpers to ExamSubmission"
```

---

## Phase 2: Background Job (Task 5)

### Task 5: ExamAutoSubmitJob

**Files:**
- Create: `backend/app/jobs/exam_auto_submit_job.rb`
- Test: `backend/test/jobs/exam_auto_submit_job_test.rb`

**Step 1: Write failing tests**

```ruby
# backend/test/jobs/exam_auto_submit_job_test.rb
require "test_helper"

class ExamAutoSubmitJobTest < ActiveSupport::TestCase
  test "auto-submits in-progress submission" do
    submission = exam_submissions(:emma_fractions_quiz)
    submission.update!(status: :in_progress, started_at: 35.minutes.ago, submitted_at: nil, graded_at: nil, score: nil, passed: nil)
    submission.classroom_exam.update!(duration_minutes: 30)

    ExamAutoSubmitJob.perform_now(submission.id)

    submission.reload
    assert_equal "submitted", submission.status
    assert submission.auto_submitted
    assert_not_nil submission.submitted_at
  end

  test "skips already-submitted submission" do
    submission = exam_submissions(:emma_fractions_quiz)
    original_submitted_at = submission.submitted_at

    ExamAutoSubmitJob.perform_now(submission.id)

    submission.reload
    assert_equal original_submitted_at, submission.submitted_at
    assert_not submission.auto_submitted
  end

  test "skips if submission not found" do
    assert_nothing_raised do
      ExamAutoSubmitJob.perform_now(-1)
    end
  end
end
```

**Step 2: Run test to verify failures**

```bash
bin/rails test test/jobs/exam_auto_submit_job_test.rb
```

**Step 3: Write implementation**

```ruby
# backend/app/jobs/exam_auto_submit_job.rb
class ExamAutoSubmitJob < ApplicationJob
  queue_as :default

  def perform(exam_submission_id)
    submission = ExamSubmission.find_by(id: exam_submission_id)
    return unless submission
    return unless submission.in_progress?

    submission.update!(
      status: :submitted,
      auto_submitted: true,
      submitted_at: Time.current
    )

    # Auto-grade MC exams
    if submission.exam.multiple_choice?
      AutoGradeSubmission.call(submission)
    end
  end
end
```

Wait — we don't have an `AutoGradeSubmission` service yet, and the grading logic is inline in `SubmitExamAnswers` mutation. For now, keep the job simple — just mark as submitted. Grading happens when teacher reviews, or we extract auto-grading later.

Simplified implementation:

```ruby
# backend/app/jobs/exam_auto_submit_job.rb
class ExamAutoSubmitJob < ApplicationJob
  queue_as :default

  def perform(exam_submission_id)
    submission = ExamSubmission.find_by(id: exam_submission_id)
    return unless submission
    return unless submission.in_progress?

    submission.update!(
      status: :submitted,
      auto_submitted: true,
      submitted_at: Time.current
    )
  end
end
```

**Step 4: Run tests**

```bash
bin/rails test test/jobs/exam_auto_submit_job_test.rb
```

**Step 5: Commit**

```bash
git add app/jobs/exam_auto_submit_job.rb test/jobs/exam_auto_submit_job_test.rb
git commit -m "feat: add ExamAutoSubmitJob for timed exam expiry"
```

---

## Phase 3: GraphQL API — Unauthenticated (Tasks 6–9)

### Task 6: GraphQL types updates

**Files:**
- Modify: `backend/app/graphql/types/classroom_exam_type.rb`
- Modify: `backend/app/graphql/types/exam_submission_type.rb`

**Step 1: Update ClassroomExamType**

Add these fields:

```ruby
    field :access_code, String
    field :duration_minutes, Integer
    field :show_results, Boolean, null: false
```

**Step 2: Update ExamSubmissionType**

Add these fields:

```ruby
    field :auto_submitted, Boolean, null: false
    field :session_token, String
    field :time_remaining, Integer, description: "Seconds remaining, null if untimed"
```

**Step 3: Commit**

```bash
git add app/graphql/types/classroom_exam_type.rb app/graphql/types/exam_submission_type.rb
git commit -m "feat: add kahoot fields to ClassroomExam and ExamSubmission GraphQL types"
```

---

### Task 7: examByAccessCode query (unauthenticated)

**Files:**
- Modify: `backend/app/graphql/types/query_type.rb`
- Test: `backend/test/graphql/queries/exam_by_access_code_test.rb`

**Step 1: Write failing test**

```ruby
# backend/test/graphql/queries/exam_by_access_code_test.rb
require "test_helper"

class ExamByAccessCodeQueryTest < ActiveSupport::TestCase
  QUERY = <<~GQL
    query($code: String!) {
      examByAccessCode(code: $code) {
        id
        accessCode
        durationMinutes
        exam { id title examType }
        classroom {
          id name
          students { id firstName lastName }
        }
      }
    }
  GQL

  test "returns exam info and student list for valid code" do
    ce = classroom_exams(:alice_mc_exam)
    ce.update!(access_code: "TEST42", status: :active)

    result = GrewmeSchema.execute(QUERY, variables: { code: "TEST42" })
    data = result.dig("data", "examByAccessCode")

    assert_not_nil data
    assert_equal ce.id.to_s, data["id"]
    assert_equal "TEST42", data["accessCode"]
    assert_not_empty data.dig("classroom", "students")
  end

  test "returns null for invalid code" do
    result = GrewmeSchema.execute(QUERY, variables: { code: "XXXXXX" })
    assert_nil result.dig("data", "examByAccessCode")
  end

  test "returns null for inactive exam" do
    ce = classroom_exams(:alice_mc_exam)
    ce.update!(access_code: "DEAD42", status: :closed)

    result = GrewmeSchema.execute(QUERY, variables: { code: "DEAD42" })
    assert_nil result.dig("data", "examByAccessCode")
  end
end
```

**Step 2: Run test to verify failure**

```bash
bin/rails test test/graphql/queries/exam_by_access_code_test.rb
```

**Step 3: Add query to query_type.rb**

Add to `backend/app/graphql/types/query_type.rb`:

```ruby
    # --- Kahoot Exam Access (unauthenticated) ---

    field :exam_by_access_code, Types::ClassroomExamType, null: true do
      description "Find an active exam by its access code (no auth required)"
      argument :code, String, required: true
    end

    def exam_by_access_code(code:)
      ClassroomExam.active.find_by(access_code: code.upcase.strip)
    end
```

Note: This query does NOT call `authenticate!` — it's intentionally public.

**Step 4: Run tests**

```bash
bin/rails test test/graphql/queries/exam_by_access_code_test.rb
```

**Step 5: Commit**

```bash
git add app/graphql/types/query_type.rb test/graphql/queries/exam_by_access_code_test.rb
git commit -m "feat: add examByAccessCode unauthenticated query"
```

---

### Task 8: startExam mutation (unauthenticated)

**Files:**
- Create: `backend/app/graphql/mutations/start_exam.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`
- Test: `backend/test/graphql/mutations/start_exam_test.rb`

**Step 1: Write failing test**

```ruby
# backend/test/graphql/mutations/start_exam_test.rb
require "test_helper"

class StartExamMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($accessCode: String!, $studentId: ID!) {
      startExam(input: { accessCode: $accessCode, studentId: $studentId }) {
        examSubmission {
          id
          sessionToken
          status
          startedAt
          timeRemaining
        }
        errors { message path }
      }
    }
  GQL

  setup do
    @ce = classroom_exams(:alice_mc_exam)
    @ce.update!(access_code: "START1", status: :active, duration_minutes: 30)
    @student = students(:student_emma)
  end

  test "creates submission and returns session token" do
    # Remove existing submission for this student+exam
    ExamSubmission.where(student: @student, classroom_exam: @ce).destroy_all

    result = GrewmeSchema.execute(MUTATION, variables: {
      accessCode: "START1", studentId: @student.id.to_s
    })
    data = result.dig("data", "startExam")

    assert_empty data["errors"]
    sub = data["examSubmission"]
    assert_not_nil sub["sessionToken"]
    assert_equal "in_progress", sub["status"]
    assert_not_nil sub["startedAt"]
  end

  test "returns existing in-progress submission (rejoin)" do
    ExamSubmission.where(student: @student, classroom_exam: @ce).destroy_all

    existing = ExamSubmission.create!(
      student: @student,
      classroom_exam: @ce,
      status: :in_progress,
      started_at: 5.minutes.ago
    )

    result = GrewmeSchema.execute(MUTATION, variables: {
      accessCode: "START1", studentId: @student.id.to_s
    })
    data = result.dig("data", "startExam", "examSubmission")

    assert_equal existing.id.to_s, data["id"]
  end

  test "rejects if student already submitted" do
    result = GrewmeSchema.execute(MUTATION, variables: {
      accessCode: "START1", studentId: @student.id.to_s
    })
    # emma_fractions_quiz is for alice_fractions_quiz, not alice_mc_exam
    # So this should create a new one. Let's test the already-submitted case explicitly:
    ExamSubmission.where(student: @student, classroom_exam: @ce).destroy_all
    ExamSubmission.create!(
      student: @student,
      classroom_exam: @ce,
      status: :submitted,
      started_at: 30.minutes.ago,
      submitted_at: 5.minutes.ago
    )

    result = GrewmeSchema.execute(MUTATION, variables: {
      accessCode: "START1", studentId: @student.id.to_s
    })
    errors = result.dig("data", "startExam", "errors")
    assert_not_empty errors
  end

  test "rejects invalid access code" do
    result = GrewmeSchema.execute(MUTATION, variables: {
      accessCode: "BADCOD", studentId: @student.id.to_s
    })
    errors = result.dig("data", "startExam", "errors")
    assert_not_empty errors
  end
end
```

**Step 2: Run test to verify failure**

```bash
bin/rails test test/graphql/mutations/start_exam_test.rb
```

**Step 3: Write mutation**

```ruby
# backend/app/graphql/mutations/start_exam.rb
# frozen_string_literal: true

module Mutations
  class StartExam < BaseMutation
    argument :access_code, String, required: true
    argument :student_id, ID, required: true

    field :exam_submission, Types::ExamSubmissionType
    field :errors, [Types::UserErrorType], null: false

    def resolve(access_code:, student_id:)
      # No authenticate! — this is public

      classroom_exam = ClassroomExam.active.find_by(access_code: access_code.upcase.strip)
      unless classroom_exam
        return { exam_submission: nil, errors: [{ message: "Invalid or expired exam code", path: ["accessCode"] }] }
      end

      student = classroom_exam.classroom.students.find_by(id: student_id)
      unless student
        return { exam_submission: nil, errors: [{ message: "Student not found in this classroom", path: ["studentId"] }] }
      end

      existing = ExamSubmission.find_by(student: student, classroom_exam: classroom_exam)

      if existing
        if existing.in_progress?
          return { exam_submission: existing, errors: [] }
        else
          return { exam_submission: nil, errors: [{ message: "You have already submitted this exam", path: ["studentId"] }] }
        end
      end

      submission = ExamSubmission.create!(
        student: student,
        classroom_exam: classroom_exam,
        status: :in_progress,
        started_at: Time.current
      )

      # Schedule auto-submit if timed
      if classroom_exam.duration_minutes
        ExamAutoSubmitJob.set(
          wait: classroom_exam.duration_minutes.minutes
        ).perform_later(submission.id)
      end

      { exam_submission: submission, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { exam_submission: nil, errors: e.record.errors.map { |err| { message: err.full_message, path: [err.attribute.to_s.camelize(:lower)] } } }
    end
  end
end
```

Register in mutation_type.rb:

```ruby
    field :start_exam, mutation: Mutations::StartExam
```

**Step 4: Run tests**

```bash
bin/rails test test/graphql/mutations/start_exam_test.rb
```

**Step 5: Commit**

```bash
git add app/graphql/mutations/start_exam.rb app/graphql/types/mutation_type.rb test/graphql/mutations/start_exam_test.rb
git commit -m "feat: add startExam mutation (unauthenticated, Kahoot-style)"
```

---

### Task 9: saveExamProgress + submitExam mutations (unauthenticated)

**Files:**
- Create: `backend/app/graphql/mutations/save_exam_progress.rb`
- Create: `backend/app/graphql/mutations/submit_exam_session.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`
- Test: `backend/test/graphql/mutations/save_exam_progress_test.rb`
- Test: `backend/test/graphql/mutations/submit_exam_session_test.rb`

**Step 1: Write failing tests for saveExamProgress**

```ruby
# backend/test/graphql/mutations/save_exam_progress_test.rb
require "test_helper"

class SaveExamProgressMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($sessionToken: String!, $answers: [ExamAnswerInput!]!) {
      saveExamProgress(input: { sessionToken: $sessionToken, answers: $answers }) {
        success
        errors { message path }
      }
    }
  GQL

  setup do
    @ce = classroom_exams(:alice_mc_exam)
    @ce.update!(access_code: "SAVE42", status: :active, duration_minutes: 30)
    @student = students(:student_finn)
    @submission = ExamSubmission.create!(
      student: @student,
      classroom_exam: @ce,
      status: :in_progress,
      started_at: 5.minutes.ago
    )
    @question = @ce.exam.exam_questions.first
  end

  test "saves answers for in-progress submission" do
    result = GrewmeSchema.execute(MUTATION, variables: {
      sessionToken: @submission.session_token,
      answers: [{ examQuestionId: @question.id.to_s, selectedAnswer: "A" }]
    })
    data = result.dig("data", "saveExamProgress")

    assert data["success"]
    assert_equal 1, @submission.exam_answers.count
  end

  test "updates existing answers" do
    @submission.exam_answers.create!(exam_question: @question, selected_answer: "A")

    result = GrewmeSchema.execute(MUTATION, variables: {
      sessionToken: @submission.session_token,
      answers: [{ examQuestionId: @question.id.to_s, selectedAnswer: "B" }]
    })

    assert result.dig("data", "saveExamProgress", "success")
    assert_equal "B", @submission.exam_answers.find_by(exam_question: @question).selected_answer
  end

  test "rejects invalid session token" do
    result = GrewmeSchema.execute(MUTATION, variables: {
      sessionToken: "invalid-token",
      answers: [{ examQuestionId: @question.id.to_s, selectedAnswer: "A" }]
    })
    errors = result.dig("data", "saveExamProgress", "errors")
    assert_not_empty errors
  end
end
```

**Step 2: Write failing tests for submitExamSession**

```ruby
# backend/test/graphql/mutations/submit_exam_session_test.rb
require "test_helper"

class SubmitExamSessionMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($sessionToken: String!) {
      submitExamSession(input: { sessionToken: $sessionToken }) {
        examSubmission {
          id
          status
          score
          submittedAt
        }
        errors { message path }
      }
    }
  GQL

  setup do
    @ce = classroom_exams(:alice_mc_exam)
    @ce.update!(access_code: "SUBMT1", status: :active, duration_minutes: 30)
    @student = students(:student_finn)
    @submission = ExamSubmission.create!(
      student: @student,
      classroom_exam: @ce,
      status: :in_progress,
      started_at: 5.minutes.ago
    )
    # Create answers
    @ce.exam.exam_questions.each do |q|
      @submission.exam_answers.create!(
        exam_question: q,
        selected_answer: q.correct_answer
      )
    end
  end

  test "submits and auto-grades MC exam" do
    result = GrewmeSchema.execute(MUTATION, variables: {
      sessionToken: @submission.session_token
    })
    data = result.dig("data", "submitExamSession", "examSubmission")

    assert_equal "graded", data["status"]
    assert_equal 100.0, data["score"]
    assert_not_nil data["submittedAt"]
  end

  test "rejects already-submitted exam" do
    @submission.update!(status: :submitted, submitted_at: Time.current)

    result = GrewmeSchema.execute(MUTATION, variables: {
      sessionToken: @submission.session_token
    })
    errors = result.dig("data", "submitExamSession", "errors")
    assert_not_empty errors
  end
end
```

**Step 3: Run tests to verify failures**

```bash
bin/rails test test/graphql/mutations/save_exam_progress_test.rb test/graphql/mutations/submit_exam_session_test.rb
```

**Step 4: Write saveExamProgress mutation**

```ruby
# backend/app/graphql/mutations/save_exam_progress.rb
# frozen_string_literal: true

module Mutations
  class SaveExamProgress < BaseMutation
    argument :session_token, String, required: true
    argument :answers, [Types::ExamAnswerInputType], required: true

    field :success, Boolean, null: false
    field :errors, [Types::UserErrorType], null: false

    def resolve(session_token:, answers:)
      submission = ExamSubmission.find_by(session_token: session_token)
      unless submission&.in_progress?
        return { success: false, errors: [{ message: "Invalid or expired session", path: ["sessionToken"] }] }
      end

      answers.each do |answer_input|
        answer = submission.exam_answers.find_or_initialize_by(
          exam_question_id: answer_input.exam_question_id
        )
        answer.selected_answer = answer_input.selected_answer
        answer.save!
      end

      { success: true, errors: [] }
    end
  end
end
```

Note: Check if `Types::ExamAnswerInputType` exists. If not, create it. The existing input type might be `Types::SubmitAnswersInputType` which wraps the whole mutation. We need a simple answer input:

```ruby
# backend/app/graphql/types/exam_answer_input_type.rb (create if not exists)
# frozen_string_literal: true

module Types
  class ExamAnswerInputType < Types::BaseInputObject
    argument :exam_question_id, ID, required: true
    argument :selected_answer, String, required: true
  end
end
```

Check if this already exists and reuse or create as needed.

**Step 5: Write submitExamSession mutation**

```ruby
# backend/app/graphql/mutations/submit_exam_session.rb
# frozen_string_literal: true

module Mutations
  class SubmitExamSession < BaseMutation
    argument :session_token, String, required: true

    field :exam_submission, Types::ExamSubmissionType
    field :errors, [Types::UserErrorType], null: false

    def resolve(session_token:)
      submission = ExamSubmission.find_by(session_token: session_token)
      unless submission&.in_progress?
        return { exam_submission: nil, errors: [{ message: "Invalid or expired session", path: ["sessionToken"] }] }
      end

      exam = submission.exam

      ActiveRecord::Base.transaction do
        submission.status = :submitted
        submission.submitted_at = Time.current
        submission.save!

        # Auto-grade MC exams
        if exam.multiple_choice?
          total_points = 0
          earned_points = 0

          submission.exam_answers.includes(:exam_question).each do |answer|
            question = answer.exam_question
            correct = question.correct_answer == answer.selected_answer
            points = correct ? question.points : 0

            answer.update!(correct: correct, points_awarded: points)

            total_points += question.points
            earned_points += points
          end

          submission.score = (total_points > 0) ? (earned_points.to_f / total_points * 100).round(2) : 0
          submission.passed = submission.score >= exam.topic&.learning_objectives&.first&.exam_pass_threshold.to_i
          submission.status = :graded
          submission.graded_at = Time.current
          submission.save!
        end
      end

      # Trigger mastery evaluation for auto-graded MC exams
      if exam.multiple_choice?
        topic = exam.topic
        EvaluateMasteryJob.perform_later(submission.student_id, topic.id) if topic
      end

      { exam_submission: submission, errors: [] }
    end
  end
end
```

Register both in mutation_type.rb:

```ruby
    field :save_exam_progress, mutation: Mutations::SaveExamProgress
    field :submit_exam_session, mutation: Mutations::SubmitExamSession
```

**Step 6: Run tests**

```bash
bin/rails test test/graphql/mutations/save_exam_progress_test.rb test/graphql/mutations/submit_exam_session_test.rb
```

**Step 7: Commit**

```bash
git add app/graphql/mutations/save_exam_progress.rb app/graphql/mutations/submit_exam_session.rb app/graphql/types/mutation_type.rb app/graphql/types/exam_answer_input_type.rb test/graphql/mutations/
git commit -m "feat: add saveExamProgress + submitExamSession mutations (unauthenticated)"
```

---

### Task 10: examSession query (rejoin support)

**Files:**
- Modify: `backend/app/graphql/types/query_type.rb`
- Test: `backend/test/graphql/queries/exam_session_test.rb`

**Step 1: Write failing test**

```ruby
# backend/test/graphql/queries/exam_session_test.rb
require "test_helper"

class ExamSessionQueryTest < ActiveSupport::TestCase
  QUERY = <<~GQL
    query($sessionToken: String!) {
      examSession(sessionToken: $sessionToken) {
        id
        status
        startedAt
        timeRemaining
        examAnswers {
          examQuestion { id }
          selectedAnswer
        }
      }
    }
  GQL

  setup do
    @ce = classroom_exams(:alice_mc_exam)
    @ce.update!(access_code: "REJN42", status: :active, duration_minutes: 30)
    @student = students(:student_finn)
    @submission = ExamSubmission.create!(
      student: @student,
      classroom_exam: @ce,
      status: :in_progress,
      started_at: 5.minutes.ago
    )
  end

  test "returns submission with answers for valid token" do
    result = GrewmeSchema.execute(QUERY, variables: { sessionToken: @submission.session_token })
    data = result.dig("data", "examSession")

    assert_not_nil data
    assert_equal "in_progress", data["status"]
    assert_not_nil data["timeRemaining"]
  end

  test "returns null for invalid token" do
    result = GrewmeSchema.execute(QUERY, variables: { sessionToken: "bad-token" })
    assert_nil result.dig("data", "examSession")
  end

  test "returns null for already-submitted session" do
    @submission.update!(status: :submitted)

    result = GrewmeSchema.execute(QUERY, variables: { sessionToken: @submission.session_token })
    assert_nil result.dig("data", "examSession")
  end
end
```

**Step 2: Run test to verify failure**

```bash
bin/rails test test/graphql/queries/exam_session_test.rb
```

**Step 3: Add query**

Add to `backend/app/graphql/types/query_type.rb`:

```ruby
    field :exam_session, Types::ExamSubmissionType, null: true do
      description "Get an in-progress exam session by token (no auth required, for rejoin)"
      argument :session_token, String, required: true
    end

    def exam_session(session_token:)
      ExamSubmission.in_progress.find_by(session_token: session_token)
    end
```

**Step 4: Run tests**

```bash
bin/rails test test/graphql/queries/exam_session_test.rb
```

**Step 5: Commit**

```bash
git add app/graphql/types/query_type.rb test/graphql/queries/exam_session_test.rb
git commit -m "feat: add examSession query for rejoin support"
```

---

## Phase 4: Frontend — Exam Taking UI (Tasks 11–14)

### Task 11: Frontend GraphQL queries

**Files:**
- Create: `front-end/src/lib/api/queries/exam.ts`
- Modify: `front-end/src/lib/api/types.ts`

**Step 1: Add types**

Add to `front-end/src/lib/api/types.ts`:

```typescript
// Kahoot-style exam access
export interface ExamSession {
  id: string;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  timeRemaining: number | null;
  sessionToken: string;
  examAnswers: ExamSessionAnswer[];
}

export interface ExamSessionAnswer {
  examQuestion: { id: string };
  selectedAnswer: string | null;
}

export interface ExamAccessInfo {
  id: string;
  accessCode: string;
  durationMinutes: number | null;
  showResults: boolean;
  exam: {
    id: string;
    title: string;
    examType: string;
    examQuestions: {
      id: string;
      questionText: string;
      answerOptions: string[] | null;
      points: number;
      generatedText?: string | null;
    }[];
  };
  classroom: {
    id: string;
    name: string;
    students: { id: string; firstName: string; lastName: string }[];
  };
}
```

**Step 2: Create query file**

```typescript
// front-end/src/lib/api/queries/exam.ts
export const EXAM_BY_ACCESS_CODE_QUERY = `
  query ExamByAccessCode($code: String!) {
    examByAccessCode(code: $code) {
      id
      accessCode
      durationMinutes
      showResults
      exam {
        id
        title
        examType
        examQuestions {
          id
          questionText
          answerOptions
          points
        }
      }
      classroom {
        id
        name
        students { id firstName lastName }
      }
    }
  }
`;

export const EXAM_SESSION_QUERY = `
  query ExamSession($sessionToken: String!) {
    examSession(sessionToken: $sessionToken) {
      id
      status
      startedAt
      timeRemaining
      sessionToken
      examAnswers {
        examQuestion { id }
        selectedAnswer
      }
    }
  }
`;

export const START_EXAM_MUTATION = `
  mutation StartExam($accessCode: String!, $studentId: ID!) {
    startExam(input: { accessCode: $accessCode, studentId: $studentId }) {
      examSubmission {
        id
        sessionToken
        status
        startedAt
        timeRemaining
      }
      errors { message path }
    }
  }
`;

export const SAVE_EXAM_PROGRESS_MUTATION = `
  mutation SaveExamProgress($sessionToken: String!, $answers: [ExamAnswerInput!]!) {
    saveExamProgress(input: { sessionToken: $sessionToken, answers: $answers }) {
      success
      errors { message path }
    }
  }
`;

export const SUBMIT_EXAM_SESSION_MUTATION = `
  mutation SubmitExamSession($sessionToken: String!) {
    submitExamSession(input: { sessionToken: $sessionToken }) {
      examSubmission {
        id
        status
        score
        submittedAt
      }
      errors { message path }
    }
  }
`;
```

**Step 3: Commit**

```bash
git add front-end/src/lib/api/queries/exam.ts front-end/src/lib/api/types.ts
git commit -m "feat: add frontend GraphQL queries for Kahoot exam access"
```

---

### Task 12: Exam route — layout + code entry page

**Files:**
- Create: `front-end/src/routes/exam/+layout.svelte`
- Create: `front-end/src/routes/exam/+page.svelte`

**Step 1: Create standalone layout (no navbar)**

```svelte
<!-- front-end/src/routes/exam/+layout.svelte -->
<script lang="ts">
  let { children } = $props();
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
  {@render children()}
</div>
```

**Step 2: Create code entry page**

```svelte
<!-- front-end/src/routes/exam/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';

  let code = $state('');
  let error = $state('');

  function handleSubmit() {
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length !== 6) {
      error = 'Please enter a 6-character exam code';
      return;
    }
    error = '';
    goto(`/exam/${cleaned}`);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  <div class="w-full max-w-md text-center">
    <h1 class="mb-2 text-3xl font-bold text-gray-900">GrewMe</h1>
    <p class="mb-8 text-gray-500">Enter the exam code from your teacher</p>

    <input
      type="text"
      bind:value={code}
      onkeydown={handleKeydown}
      placeholder="Enter code"
      maxlength="6"
      class="w-full rounded-xl border-2 border-gray-200 p-4 text-center text-2xl font-mono uppercase tracking-widest focus:border-blue-500 focus:outline-none"
      autofocus
    />

    {#if error}
      <p class="mt-2 text-sm text-red-500">{error}</p>
    {/if}

    <button
      onclick={handleSubmit}
      disabled={code.trim().length < 6}
      class="mt-4 w-full rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
    >
      Join Exam
    </button>
  </div>
</div>
```

**Step 3: Commit**

```bash
git add front-end/src/routes/exam/
git commit -m "feat: add /exam code entry page with standalone layout"
```

---

### Task 13: Exam route — student picker + exam start

**Files:**
- Create: `front-end/src/routes/exam/[code]/+page.server.ts`
- Create: `front-end/src/routes/exam/[code]/+page.svelte`

**Step 1: Create server load function**

```typescript
// front-end/src/routes/exam/[code]/+page.server.ts
import type { PageServerLoad } from './$types';
import { EXAM_BY_ACCESS_CODE_QUERY } from '$lib/api/queries/exam';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: EXAM_BY_ACCESS_CODE_QUERY,
      variables: { code: params.code }
    })
  });
  const json = await res.json();

  return {
    code: params.code,
    examAccess: json.data?.examByAccessCode ?? null
  };
};
```

**Step 2: Create exam page (student picker → confirm → take exam → results)**

This is a large component with multiple states. Create it as a single page with state machine:

```svelte
<!-- front-end/src/routes/exam/[code]/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ExamAccessInfo, ExamSession } from '$lib/api/types';
  import {
    START_EXAM_MUTATION,
    SAVE_EXAM_PROGRESS_MUTATION,
    SUBMIT_EXAM_SESSION_MUTATION,
    EXAM_SESSION_QUERY
  } from '$lib/api/queries/exam';

  let { data } = $props();

  type ExamState = 'pick_student' | 'confirm' | 'taking' | 'submitted' | 'not_found';

  let state: ExamState = $state(data.examAccess ? 'pick_student' : 'not_found');
  let selectedStudentId = $state<string | null>(null);
  let sessionToken = $state<string | null>(null);
  let answers = $state<Record<string, string>>({});
  let timeRemaining = $state<number | null>(null);
  let submissionResult = $state<{ status: string; score: number | null } | null>(null);
  let error = $state('');
  let saving = $state(false);
  let submitting = $state(false);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  const examAccess: ExamAccessInfo | null = data.examAccess;
  const students = $derived(
    (examAccess?.classroom.students ?? []).toSorted((a, b) =>
      a.firstName.localeCompare(b.firstName)
    )
  );
  const questions = $derived(examAccess?.exam.examQuestions ?? []);
  const answeredCount = $derived(Object.keys(answers).length);

  // Check for existing session on mount
  onMount(() => {
    const savedToken = sessionStorage.getItem(`exam-${data.code}`);
    if (savedToken) tryRejoin(savedToken);
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
    if (autoSaveInterval) clearInterval(autoSaveInterval);
  });

  async function tryRejoin(token: string) {
    const res = await gql(EXAM_SESSION_QUERY, { sessionToken: token });
    const session = res.data?.examSession;
    if (session) {
      sessionToken = token;
      timeRemaining = session.timeRemaining;
      // Restore answers
      for (const a of session.examAnswers) {
        if (a.selectedAnswer) answers[a.examQuestion.id] = a.selectedAnswer;
      }
      state = 'taking';
      startTimers();
    } else {
      sessionStorage.removeItem(`exam-${data.code}`);
    }
  }

  async function selectStudent(studentId: string) {
    selectedStudentId = studentId;
    state = 'confirm';
  }

  async function startExam() {
    error = '';
    const res = await gql(START_EXAM_MUTATION, {
      accessCode: data.code,
      studentId: selectedStudentId
    });
    const result = res.data?.startExam;
    if (result?.errors?.length) {
      error = result.errors[0].message;
      return;
    }

    sessionToken = result.examSubmission.sessionToken;
    timeRemaining = result.examSubmission.timeRemaining;
    sessionStorage.setItem(`exam-${data.code}`, sessionToken!);
    state = 'taking';
    startTimers();
  }

  function startTimers() {
    // Countdown timer
    if (timeRemaining !== null) {
      timerInterval = setInterval(() => {
        if (timeRemaining !== null) {
          timeRemaining = Math.max(0, timeRemaining - 1);
          if (timeRemaining === 0) submitExam(true);
        }
      }, 1000);
    }
    // Auto-save every 30s
    autoSaveInterval = setInterval(saveProgress, 30000);
  }

  async function saveProgress() {
    if (!sessionToken || saving) return;
    const answerList = Object.entries(answers).map(([qId, ans]) => ({
      examQuestionId: qId,
      selectedAnswer: ans
    }));
    if (answerList.length === 0) return;

    saving = true;
    await gql(SAVE_EXAM_PROGRESS_MUTATION, { sessionToken, answers: answerList });
    saving = false;
  }

  async function submitExam(auto = false) {
    if (!sessionToken || submitting) return;
    submitting = true;

    // Save progress first
    await saveProgress();

    const res = await gql(SUBMIT_EXAM_SESSION_MUTATION, { sessionToken });
    const result = res.data?.submitExamSession;

    if (timerInterval) clearInterval(timerInterval);
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    sessionStorage.removeItem(`exam-${data.code}`);

    if (result?.examSubmission) {
      submissionResult = {
        status: result.examSubmission.status,
        score: result.examSubmission.score
      };
    }
    state = 'submitted';
    submitting = false;
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async function gql(query: string, variables: Record<string, unknown>) {
    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    return res.json();
  }

  const selectedStudent = $derived(students.find(s => s.id === selectedStudentId));
</script>

{#if state === 'not_found'}
  <!-- Exam not found -->
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="text-center">
      <p class="text-6xl">😕</p>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">Exam Not Found</h1>
      <p class="mt-2 text-gray-500">Code "{data.code}" is invalid or the exam has ended.</p>
      <a href="/exam" class="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
        Try Another Code
      </a>
    </div>
  </div>

{:else if state === 'pick_student'}
  <!-- Student picker -->
  <div class="mx-auto max-w-lg p-4 pt-12">
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-bold text-gray-900">{examAccess?.exam.title}</h1>
      <p class="text-gray-500">{examAccess?.classroom.name}</p>
    </div>

    <p class="mb-4 text-center text-sm font-medium text-gray-700">Who are you?</p>

    <div class="grid grid-cols-2 gap-3">
      {#each students as student}
        <button
          onclick={() => selectStudent(student.id)}
          class="rounded-xl border-2 border-gray-200 p-3 text-center transition hover:border-blue-400 hover:bg-blue-50"
        >
          <span class="font-medium">{student.firstName} {student.lastName}</span>
        </button>
      {/each}
    </div>
  </div>

{:else if state === 'confirm'}
  <!-- Confirm start -->
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-md text-center">
      <p class="text-5xl">📝</p>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">{examAccess?.exam.title}</h1>
      <p class="mt-1 text-gray-500">Hi, {selectedStudent?.firstName}!</p>

      <div class="mt-6 rounded-xl bg-gray-50 p-4 text-left text-sm">
        <p><span class="font-medium">Questions:</span> {questions.length}</p>
        {#if examAccess?.durationMinutes}
          <p><span class="font-medium">Time limit:</span> {examAccess.durationMinutes} minutes</p>
        {:else}
          <p><span class="font-medium">Time limit:</span> No limit</p>
        {/if}
      </div>

      {#if error}
        <p class="mt-3 text-sm text-red-500">{error}</p>
      {/if}

      <button
        onclick={startExam}
        class="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
      >
        Start Exam
      </button>

      <button
        onclick={() => { state = 'pick_student'; selectedStudentId = null; }}
        class="mt-2 text-sm text-gray-500 hover:text-gray-700"
      >
        Not you? Pick a different name
      </button>
    </div>
  </div>

{:else if state === 'taking'}
  <!-- Taking exam -->
  <div class="mx-auto max-w-2xl p-4">
    <!-- Header with timer -->
    <div class="sticky top-0 z-10 mb-6 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
      <div>
        <h1 class="font-bold text-gray-900">{examAccess?.exam.title}</h1>
        <p class="text-sm text-gray-500">{answeredCount}/{questions.length} answered</p>
      </div>
      <div class="flex items-center gap-3">
        {#if saving}
          <span class="text-xs text-gray-400">Saving...</span>
        {/if}
        {#if timeRemaining !== null}
          <span class="rounded-lg px-3 py-1 font-mono text-lg font-bold"
            class:bg-red-100={timeRemaining < 60}
            class:text-red-700={timeRemaining < 60}
            class:bg-blue-100={timeRemaining >= 60}
            class:text-blue-700={timeRemaining >= 60}
          >
            {formatTime(timeRemaining)}
          </span>
        {/if}
      </div>
    </div>

    <!-- Questions -->
    {#each questions as question, i}
      <div class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <p class="mb-3 font-medium text-gray-900">
          <span class="text-gray-400">{i + 1}.</span>
          {question.questionText}
        </p>

        {#if question.answerOptions}
          <div class="space-y-2">
            {#each question.answerOptions as option}
              <label
                class="flex cursor-pointer items-center rounded-lg border-2 p-3 transition"
                class:border-blue-500={answers[question.id] === option}
                class:bg-blue-50={answers[question.id] === option}
                class:border-gray-200={answers[question.id] !== option}
              >
                <input
                  type="radio"
                  name="q-{question.id}"
                  value={option}
                  checked={answers[question.id] === option}
                  onchange={() => { answers[question.id] = option; }}
                  class="sr-only"
                />
                <span class="text-sm">{option}</span>
              </label>
            {/each}
          </div>
        {:else}
          <textarea
            value={answers[question.id] ?? ''}
            oninput={(e) => { answers[question.id] = (e.target as HTMLTextAreaElement).value; }}
            rows="3"
            class="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Type your answer..."
          ></textarea>
        {/if}
      </div>
    {/each}

    <!-- Submit button -->
    <div class="sticky bottom-4 mt-4">
      <button
        onclick={() => submitExam()}
        disabled={submitting}
        class="w-full rounded-xl bg-green-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-green-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Exam'}
      </button>
    </div>
  </div>

{:else if state === 'submitted'}
  <!-- Submitted -->
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-md text-center">
      <p class="text-6xl">🎉</p>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">Exam Submitted!</h1>

      {#if submissionResult?.score !== null && submissionResult?.score !== undefined && examAccess?.showResults}
        <div class="mt-6 rounded-xl bg-green-50 p-6">
          <p class="text-sm text-green-600">Your Score</p>
          <p class="text-4xl font-bold text-green-700">{submissionResult.score}%</p>
        </div>
      {:else}
        <p class="mt-4 text-gray-500">Your answers have been submitted. Your teacher will review them.</p>
      {/if}

      <p class="mt-8 text-sm text-gray-400">You can close this page now.</p>
    </div>
  </div>
{/if}
```

**Step 3: Commit**

```bash
git add front-end/src/routes/exam/
git commit -m "feat: add /exam/[code] student picker + exam taking UI"
```

---

### Task 14: Teacher-side — show access code + duration settings

**Files:**
- Modify: `front-end/src/routes/teacher/exams/[examId]/+page.svelte` (exam detail / assign page)

**Step 1: Find the exam assignment page**

Look at `front-end/src/routes/teacher/exams/[examId]/+page.svelte`. This is where teachers assign exams to classrooms. After assignment, it should display the access code.

**Step 2: Add duration_minutes + show_results to assign mutation**

Update the `AssignExamToClassroom` mutation to accept `durationMinutes` and `showResults` args.

In `backend/app/graphql/mutations/assign_exam_to_classroom.rb`, add:

```ruby
    argument :duration_minutes, Integer, required: false
    argument :show_results, Boolean, required: false
```

And in resolve, pass them to the ClassroomExam creation.

**Step 3: Show access code after assignment**

In the teacher exam detail page, display the access code prominently with a copy button. Add duration_minutes selector.

**Step 4: Update the ClassroomExamType query**

Make sure the teacher exam detail page fetches `accessCode`, `durationMinutes`, `showResults` from the ClassroomExam.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: show access code on teacher exam page + duration settings"
```

---

## Phase 5: Integration & Verification (Tasks 15–16)

### Task 15: Integration test — full Kahoot exam flow

**Files:**
- Create: `backend/test/integration/kahoot_exam_flow_test.rb`

**Step 1: Write integration test**

```ruby
# backend/test/integration/kahoot_exam_flow_test.rb
require "test_helper"

class KahootExamFlowTest < ActiveSupport::TestCase
  test "full flow: teacher assigns → student takes → auto-graded" do
    # 1. Teacher assigns exam to classroom (code auto-generated)
    ce = ClassroomExam.create!(
      exam: exams(:fractions_mc_exam),
      classroom: classrooms(:alice_class),
      assigned_by: teachers(:teacher_alice),
      status: :active,
      duration_minutes: 30,
      show_results: true
    )
    assert_present ce.access_code

    # 2. Student looks up exam by code
    found = ClassroomExam.active.find_by(access_code: ce.access_code)
    assert_equal ce, found

    # 3. Student starts exam
    student = students(:student_finn)
    result = GrewmeSchema.execute(<<~GQL, variables: { accessCode: ce.access_code, studentId: student.id.to_s })
      mutation($accessCode: String!, $studentId: ID!) {
        startExam(input: { accessCode: $accessCode, studentId: $studentId }) {
          examSubmission { id sessionToken status startedAt }
          errors { message }
        }
      }
    GQL

    sub_data = result.dig("data", "startExam", "examSubmission")
    assert_not_nil sub_data["sessionToken"]
    session_token = sub_data["sessionToken"]

    # 4. Student saves progress
    question = ce.exam.exam_questions.first
    result = GrewmeSchema.execute(<<~GQL, variables: { sessionToken: session_token, answers: [{ examQuestionId: question.id.to_s, selectedAnswer: question.correct_answer }] })
      mutation($sessionToken: String!, $answers: [ExamAnswerInput!]!) {
        saveExamProgress(input: { sessionToken: $sessionToken, answers: $answers }) {
          success
          errors { message }
        }
      }
    GQL
    assert result.dig("data", "saveExamProgress", "success")

    # 5. Student submits
    result = GrewmeSchema.execute(<<~GQL, variables: { sessionToken: session_token })
      mutation($sessionToken: String!) {
        submitExamSession(input: { sessionToken: $sessionToken }) {
          examSubmission { id status score }
          errors { message }
        }
      }
    GQL
    sub = result.dig("data", "submitExamSession", "examSubmission")
    assert_equal "graded", sub["status"]
    assert sub["score"] > 0
  end
end
```

**Step 2: Run test**

```bash
bin/rails test test/integration/kahoot_exam_flow_test.rb
```

**Step 3: Commit**

```bash
git add test/integration/kahoot_exam_flow_test.rb
git commit -m "test: add full Kahoot exam flow integration test"
```

---

### Task 16: Run full test suite + verify

**Step 1: Run full backend test suite**

```bash
bin/rails test
```

Expected: 0 failures, 0 errors.

**Step 2: Run frontend type check**

```bash
cd ../front-end && npx svelte-check
```

Check that no NEW errors were introduced in our files.

**Step 3: Verify manually**

1. Start dev server
2. Navigate to `/exam` — should see code entry page
3. Use a known access_code from the database
4. Pick a student name → confirm → take exam → submit

**Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: address test suite issues from Kahoot exam feature"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1–4 | Database migration + model updates (access_code, session_token, time helpers) |
| 2 | 5 | ExamAutoSubmitJob background job |
| 3 | 6–10 | GraphQL API: types, unauthenticated queries + mutations |
| 4 | 11–14 | Frontend: queries, /exam route, student picker, exam taking UI, teacher code display |
| 5 | 15–16 | Integration test + full suite verification |

**Total: 16 tasks, ~2-3 hours estimated.**
