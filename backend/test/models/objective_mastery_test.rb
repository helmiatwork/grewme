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

  test "mastered scope returns only fully mastered" do
    om = objective_masteries(:emma_add_fractions)
    om.update!(exam_mastered: true, daily_mastered: true)

    assert_includes ObjectiveMastery.mastered, om
  end

  test "mastered scope excludes partially mastered" do
    om = objective_masteries(:emma_add_fractions)
    om.update!(exam_mastered: true, daily_mastered: false)

    assert_not_includes ObjectiveMastery.mastered, om
  end

  test "for_student scope filters by student" do
    om = objective_masteries(:emma_add_fractions)

    assert_includes ObjectiveMastery.for_student(students(:student_emma).id), om
    assert_not_includes ObjectiveMastery.for_student(students(:student_finn).id), om
  end
end
