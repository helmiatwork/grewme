require "test_helper"

class FormulaEvaluatorTest < ActiveSupport::TestCase
  test "evaluates simple addition" do
    result = FormulaEvaluator.evaluate("a + b", { "a" => 10, "b" => 7 })
    assert_equal 17, result
  end

  test "evaluates multiplication" do
    result = FormulaEvaluator.evaluate("width * height", { "width" => 5, "height" => 8 })
    assert_equal 40, result
  end

  test "evaluates complex formula" do
    result = FormulaEvaluator.evaluate("2 * (width + height)", { "width" => 5, "height" => 8 })
    assert_equal 26, result
  end

  test "evaluates division" do
    result = FormulaEvaluator.evaluate("dividend / divisor", { "dividend" => 24, "divisor" => 6 })
    assert_equal 4, result
  end

  test "evaluates triangle area with decimal result" do
    result = FormulaEvaluator.evaluate("base * height / 2", { "base" => 7, "height" => 5 })
    assert_equal 17.5, result
  end

  test "evaluates linear equation solution" do
    result = FormulaEvaluator.evaluate("(c - b) / a", { "a" => 3, "b" => 5, "c" => 20 })
    assert_equal 5, result
  end

  test "returns nil for invalid formula" do
    result = FormulaEvaluator.evaluate("invalid!!!", { "a" => 1 })
    assert_nil result
  end

  test "formats result as string" do
    result = FormulaEvaluator.evaluate_to_s("a + b", { "a" => 10, "b" => 7 })
    assert_equal "17", result
  end

  test "formats decimal result without trailing zeros" do
    result = FormulaEvaluator.evaluate_to_s("base * height / 2", { "base" => 7, "height" => 5 })
    assert_equal "17.5", result
  end

  test "formats integer result without decimal" do
    result = FormulaEvaluator.evaluate_to_s("a * b", { "a" => 3, "b" => 4 })
    assert_equal "12", result
  end
end
