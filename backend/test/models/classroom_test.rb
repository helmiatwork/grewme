require "test_helper"

class ClassroomTest < ActiveSupport::TestCase
  test "validates name presence" do
    classroom = Classroom.new(name: nil, school: schools(:greenwood))
    assert_not classroom.valid?
    assert_includes classroom.errors[:name], "can't be blank"
  end

  test "belongs to school" do
    assert_equal schools(:greenwood), classrooms(:alice_class).school
  end

  test "has many teachers through classroom_teachers" do
    classroom = classrooms(:alice_class)
    assert_includes classroom.teachers, teachers(:teacher_alice)
  end

  test "has many students through classroom_students" do
    classroom = classrooms(:alice_class)
    student_names = classroom.students.map(&:name)
    assert_includes student_names, "Emma"
    assert_includes student_names, "Finn"
  end

  test "primary_teacher returns the primary teacher" do
    classroom = classrooms(:alice_class)
    assert_equal teachers(:teacher_alice), classroom.primary_teacher
  end
end
