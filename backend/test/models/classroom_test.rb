require "test_helper"

class ClassroomTest < ActiveSupport::TestCase
  test "validates name presence" do
    classroom = Classroom.new(name: nil, school: schools(:greenwood), teacher: teachers(:teacher_alice))
    assert_not classroom.valid?
    assert_includes classroom.errors[:name], "can't be blank"
  end

  test "belongs to school" do
    assert_equal schools(:greenwood), classrooms(:alice_class).school
  end

  test "belongs to teacher" do
    assert_equal teachers(:teacher_alice), classrooms(:alice_class).teacher
  end

  test "has many students through classroom_students" do
    classroom = classrooms(:alice_class)
    student_names = classroom.students.map(&:name)
    assert_includes student_names, "Emma"
    assert_includes student_names, "Finn"
  end
end
