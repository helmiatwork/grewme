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
