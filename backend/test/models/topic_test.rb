require "test_helper"

class TopicTest < ActiveSupport::TestCase
  test "validates name presence" do
    topic = Topic.new(subject: subjects(:math))
    assert_not topic.valid?
    assert_includes topic.errors[:name], "can't be blank"
  end

  test "validates name uniqueness per subject" do
    existing = topics(:fractions)
    duplicate = Topic.new(name: existing.name, subject: existing.subject)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:name], "has already been taken"
  end

  test "allows same name in different subjects" do
    topic = Topic.new(name: "Fractions", subject: subjects(:reading))
    assert topic.valid?
  end

  test "belongs to subject" do
    topic = topics(:fractions)
    assert_equal subjects(:math), topic.subject
  end

  test "has many learning_objectives" do
    topic = topics(:fractions)
    assert_respond_to topic, :learning_objectives
  end

  test "destroys dependent learning_objectives" do
    topic = topics(:poetry)
    topic.learning_objectives.create!(name: "Identify rhyme schemes")
    assert_difference "LearningObjective.count", -1 do
      topic.destroy
    end
  end

  test "has position default 0" do
    topic = Topic.new(name: "New Topic", subject: subjects(:math))
    assert_equal 0, topic.position
  end
end
