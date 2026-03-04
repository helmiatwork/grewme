require "test_helper"

class ClassroomTest < ActiveSupport::TestCase
  test "validates name presence" do
    classroom = Classroom.new(name: nil, school: schools(:greenwood), teacher: users(:teacher_alice))
    assert_not classroom.valid?
    assert_includes classroom.errors[:name], "can't be blank"
  end

  test "belongs to school" do
    assert_equal schools(:greenwood), classrooms(:alice_class).school
  end

  test "belongs to teacher" do
    assert_equal users(:teacher_alice), classrooms(:alice_class).teacher
  end

  test "has many students" do
    assert_includes classrooms(:alice_class).students, students(:student_emma)
    assert_includes classrooms(:alice_class).students, students(:student_finn)
  end
end
