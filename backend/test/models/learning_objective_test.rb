require "test_helper"

class LearningObjectiveTest < ActiveSupport::TestCase
  test "validates name presence" do
    obj = LearningObjective.new(topic: topics(:fractions))
    assert_not obj.valid?
    assert_includes obj.errors[:name], "can't be blank"
  end

  test "validates name uniqueness per topic" do
    existing = learning_objectives(:add_fractions)
    duplicate = LearningObjective.new(name: existing.name, topic: existing.topic)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:name], "has already been taken"
  end

  test "belongs to topic" do
    obj = learning_objectives(:add_fractions)
    assert_equal topics(:fractions), obj.topic
  end

  test "exam_pass_threshold defaults to 70" do
    obj = LearningObjective.new(name: "Test", topic: topics(:fractions))
    obj.valid?
    assert_equal 70, obj.exam_pass_threshold
  end

  test "daily_score_threshold defaults to 75" do
    obj = LearningObjective.new(name: "Test", topic: topics(:fractions))
    obj.valid?
    assert_equal 75, obj.daily_score_threshold
  end

  test "validates exam_pass_threshold range 0-100" do
    obj = LearningObjective.new(name: "Test", topic: topics(:fractions), exam_pass_threshold: 101)
    assert_not obj.valid?
    assert_includes obj.errors[:exam_pass_threshold], "must be less than or equal to 100"

    obj.exam_pass_threshold = -1
    assert_not obj.valid?
    assert_includes obj.errors[:exam_pass_threshold], "must be greater than or equal to 0"
  end

  test "validates daily_score_threshold range 0-100" do
    obj = LearningObjective.new(name: "Test", topic: topics(:fractions), daily_score_threshold: 101)
    assert_not obj.valid?
    assert_includes obj.errors[:daily_score_threshold], "must be less than or equal to 100"
  end

  test "can access subject through topic" do
    obj = learning_objectives(:add_fractions)
    assert_equal subjects(:math), obj.topic.subject
  end
end
