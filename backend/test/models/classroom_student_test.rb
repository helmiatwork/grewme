require "test_helper"

class ClassroomStudentTest < ActiveSupport::TestCase
  test "validates academic_year presence" do
    cs = ClassroomStudent.new(student: students(:student_emma), classroom: classrooms(:alice_class), enrolled_at: Date.current, academic_year: nil)
    assert_not cs.valid?
    assert_includes cs.errors[:academic_year], "can't be blank"
  end

  test "validates enrolled_at presence" do
    cs = ClassroomStudent.new(student: students(:student_emma), classroom: classrooms(:alice_class), academic_year: "2025/2026", enrolled_at: nil)
    assert_not cs.valid?
    assert_includes cs.errors[:enrolled_at], "can't be blank"
  end

  test "current scope returns active enrollments" do
    active = ClassroomStudent.current
    assert active.all?(&:active?)
  end

  test "deactivate sets status to inactive" do
    cs = classroom_students(:emma_in_alice_class)
    cs.deactivate!
    assert cs.inactive?
    assert_not_nil cs.left_at
  end

  test "belongs to student and classroom" do
    cs = classroom_students(:emma_in_alice_class)
    assert_equal students(:student_emma), cs.student
    assert_equal classrooms(:alice_class), cs.classroom
  end
end
