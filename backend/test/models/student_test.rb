require "test_helper"

class StudentTest < ActiveSupport::TestCase
  test "validates name presence" do
    student = Student.new(name: nil)
    assert_not student.valid?
    assert_includes student.errors[:name], "can't be blank"
  end

  test "current_classroom returns active classroom" do
    student = students(:student_emma)
    assert_equal classrooms(:alice_class), student.current_classroom
  end

  test "has many daily_scores" do
    assert students(:student_emma).daily_scores.count > 0
  end

  test "has many parents through parent_students" do
    assert_includes students(:student_emma).parents, parents(:parent_carol)
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

  test "enroll creates classroom_student" do
    student = Student.create!(name: "New Student")
    student.enroll!(classrooms(:alice_class), academic_year: "2025/2026")
    assert_equal classrooms(:alice_class), student.current_classroom
  end

  test "enroll deactivates previous enrollment" do
    student = students(:student_emma)
    old_enrollment = student.current_enrollment
    student.enroll!(classrooms(:bob_class), academic_year: "2025/2026")

    old_enrollment.reload
    assert old_enrollment.inactive?
    assert_equal classrooms(:bob_class), student.current_classroom
  end
end
