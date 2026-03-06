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
