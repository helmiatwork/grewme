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
