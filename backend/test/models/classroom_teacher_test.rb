require "test_helper"

class ClassroomTeacherTest < ActiveSupport::TestCase
  test "valid with classroom, teacher, and role" do
    ct = ClassroomTeacher.new(
      classroom: classrooms(:bob_class),
      teacher: teachers(:teacher_alice),
      role: "primary"
    )
    assert ct.valid?
  end

  test "validates role presence" do
    ct = ClassroomTeacher.new(
      classroom: classrooms(:alice_class),
      teacher: teachers(:teacher_bob),
      role: nil
    )
    assert_not ct.valid?
    assert_includes ct.errors[:role], "can't be blank"
  end

  test "validates role inclusion" do
    ct = ClassroomTeacher.new(
      classroom: classrooms(:bob_class),
      teacher: teachers(:teacher_alice),
      role: "janitor"
    )
    assert_not ct.valid?
    assert_includes ct.errors[:role], "is not included in the list"
  end

  test "validates teacher uniqueness per classroom" do
    existing = classroom_teachers(:alice_teaches_alice_class)
    duplicate = ClassroomTeacher.new(
      classroom: existing.classroom,
      teacher: existing.teacher,
      role: "assistant"
    )
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:teacher_id], "is already assigned to this classroom"
  end

  test "belongs to classroom and teacher" do
    ct = classroom_teachers(:alice_teaches_alice_class)
    assert_equal classrooms(:alice_class), ct.classroom
    assert_equal teachers(:teacher_alice), ct.teacher
  end

  test "primary scope returns primary role records" do
    results = ClassroomTeacher.primary
    assert results.all? { |ct| ct.role == "primary" }
  end

  test "assistants scope returns assistant role records" do
    ClassroomTeacher.create!(
      classroom: classrooms(:bob_class),
      teacher: teachers(:teacher_alice),
      role: "assistant"
    )
    results = ClassroomTeacher.assistants
    assert results.all? { |ct| ct.role == "assistant" }
  end

  test "ROLES constant contains expected values" do
    assert_equal %w[primary assistant substitute], ClassroomTeacher::ROLES
  end
end
