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

  test "validates uniqueness of question per submission" do
    sub = exam_submissions(:emma_fractions_quiz)
    q = exam_questions(:mc_q1)

    ExamAnswer.create!(exam_submission: sub, exam_question: q, selected_answer: "A")
    duplicate = ExamAnswer.new(exam_submission: sub, exam_question: q, selected_answer: "B")
    assert_not duplicate.valid?
  end
end
