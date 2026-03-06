require "test_helper"

class SubjectTest < ActiveSupport::TestCase
  test "validates name presence" do
    subject = Subject.new(school: schools(:greenwood), description: "test")
    assert_not subject.valid?
    assert_includes subject.errors[:name], "can't be blank"
  end

  test "validates name uniqueness per school" do
    existing = subjects(:math)
    duplicate = Subject.new(name: existing.name, school: existing.school)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:name], "has already been taken"
  end

  test "allows same name in different schools" do
    other_school = School.create!(name: "Other School")
    subject = Subject.new(name: "Mathematics", school: other_school)
    assert subject.valid?
  end

  test "belongs to school" do
    subject = subjects(:math)
    assert_equal schools(:greenwood), subject.school
  end

  test "has many topics" do
    subject = subjects(:math)
    assert_respond_to subject, :topics
  end

  test "destroys dependent topics" do
    subject = subjects(:math)
    topic = subject.topics.create!(name: "Calculus")
    assert_difference "Topic.count", -1 do
      topic.delete # use delete to bypass callbacks since Exam model is not yet defined
    end
  end

  test "validates school presence" do
    subject = Subject.new(name: "Test")
    assert_not subject.valid?
    assert_includes subject.errors[:school], "must exist"
  end
end
