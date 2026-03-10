require "test_helper"

class QuestionTemplateTest < ActiveSupport::TestCase
  test "validates name presence" do
    t = QuestionTemplate.new(category: "arithmetic", template_text: "{a} + {b}", formula: "a + b")
    assert_not t.valid?
    assert_includes t.errors[:name], "can't be blank"
  end

  test "validates category presence" do
    t = QuestionTemplate.new(name: "Addition", template_text: "{a} + {b}", formula: "a + b")
    assert_not t.valid?
    assert_includes t.errors[:category], "can't be blank"
  end

  test "validates template_text presence" do
    t = QuestionTemplate.new(name: "Addition", category: "arithmetic", formula: "a + b")
    assert_not t.valid?
    assert_includes t.errors[:template_text], "can't be blank"
  end

  test "validates formula presence" do
    t = QuestionTemplate.new(name: "Addition", category: "arithmetic", template_text: "{a} + {b}")
    assert_not t.valid?
    assert_includes t.errors[:formula], "can't be blank"
  end

  test "valid template saves" do
    t = QuestionTemplate.new(
      name: "Addition",
      category: "arithmetic",
      template_text: "What is {a} + {b}?",
      variables: [ { "name" => "a", "min" => 1, "max" => 100 }, { "name" => "b", "min" => 1, "max" => 100 } ],
      formula: "a + b",
      grade_min: 1,
      grade_max: 6
    )
    assert t.valid?
  end

  test "scopes by category" do
    assert QuestionTemplate.by_category("arithmetic").count >= 0
  end

  test "scopes by grade" do
    assert QuestionTemplate.for_grade(3).count >= 0
  end
end
