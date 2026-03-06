require "test_helper"

class ExamTest < ActiveSupport::TestCase
  test "validates title presence" do
    exam = Exam.new(topic: topics(:fractions), exam_type: :score_based, created_by: teachers(:teacher_alice))
    assert_not exam.valid?
    assert_includes exam.errors[:title], "can't be blank"
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
