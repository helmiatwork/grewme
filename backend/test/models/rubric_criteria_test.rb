require "test_helper"

class RubricCriteriaTest < ActiveSupport::TestCase
  set_fixture_class rubric_criteria: RubricCriteria
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
