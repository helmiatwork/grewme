require "test_helper"

class StudentTest < ActiveSupport::TestCase
  test "validates name presence" do
    student = Student.new(name: nil, classroom: classrooms(:alice_class))
    assert_not student.valid?
    assert_includes student.errors[:name], "can't be blank"
  end

  test "belongs to classroom" do
    assert_equal classrooms(:alice_class), students(:student_emma).classroom
  end

  test "has many daily_scores" do
    assert students(:student_emma).daily_scores.count > 0
  end

  test "has many parents through parent_students" do
    assert_includes students(:student_emma).parents, users(:parent_carol)
  end

  test "radar_data returns skill averages" do
    result = students(:student_emma).radar_data
    assert_kind_of Hash, result
    assert result.key?("reading") || result.key?(:reading)
  end

  test "radar_data filters by date range" do
    result = students(:student_emma).radar_data(start_date: Date.new(2026, 3, 1), end_date: Date.new(2026, 3, 1))
    assert_kind_of Hash, result
  end
end
