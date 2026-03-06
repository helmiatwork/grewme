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

  test "validates uniqueness of criteria per submission" do
    sub = exam_submissions(:emma_fractions_quiz)
    criteria = rubric_criteria(:creativity)

    RubricScore.create!(exam_submission: sub, rubric_criteria: criteria, score: 4)
    duplicate = RubricScore.new(exam_submission: sub, rubric_criteria: criteria, score: 3)
    assert_not duplicate.valid?
  end
end
