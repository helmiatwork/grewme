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

  test "graded scope returns only graded submissions" do
    sub = exam_submissions(:emma_fractions_quiz)
    sub.update!(status: :graded)

    assert_includes ExamSubmission.graded, sub
  end

  test "graded scope excludes non-graded submissions" do
    sub = exam_submissions(:emma_fractions_quiz)
    sub.update!(status: :submitted)

    assert_not_includes ExamSubmission.graded, sub
  end

  test "for_student scope filters by student" do
    sub = exam_submissions(:emma_fractions_quiz)

    assert_includes ExamSubmission.for_student(students(:student_emma).id), sub
    assert_not_includes ExamSubmission.for_student(students(:student_finn).id), sub
  end

  test "exam method returns the exam through classroom_exam" do
    sub = exam_submissions(:emma_fractions_quiz)
    assert_equal exams(:fractions_score_exam), sub.exam
  end

  test "passed? returns true when passed is true" do
    sub = exam_submissions(:emma_fractions_quiz)
    sub.passed = true
    assert sub.passed?
  end

  test "passed? returns false when passed is false" do
    sub = exam_submissions(:emma_fractions_quiz)
    sub.passed = false
    assert_not sub.passed?
  end

  test "passed? returns false when passed is nil" do
    sub = exam_submissions(:emma_fractions_quiz)
    sub.passed = nil
    assert_not sub.passed?
  end

  test "generates session_token before create" do
    submission = ExamSubmission.create!(
      student: students(:student_finn),
      classroom_exam: classroom_exams(:alice_mc_exam),
      status: :in_progress,
      started_at: Time.current
    )
    assert_not_nil submission.session_token
  end

  test "session_token is unique" do
    existing = exam_submissions(:emma_fractions_quiz)
    new_sub = ExamSubmission.new(
      student: students(:student_finn),
      classroom_exam: classroom_exams(:alice_mc_exam),
      session_token: existing.session_token
    )
    assert_not new_sub.valid?
  end

  test "time_remaining returns seconds left" do
    sub = exam_submissions(:emma_fractions_quiz)
    sub.started_at = 10.minutes.ago
    sub.classroom_exam.duration_minutes = 30
    remaining = sub.time_remaining
    assert_in_delta 1200, remaining, 2
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
end
