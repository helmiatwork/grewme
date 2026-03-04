require "test_helper"

class TeacherTest < ActiveSupport::TestCase
  test "validates name presence" do
    teacher = Teacher.new(name: nil, email: "test@test.com", password: "password123")
    assert_not teacher.valid?
    assert_includes teacher.errors[:name], "can't be blank"
  end

  test "validates email presence" do
    teacher = Teacher.new(name: "Test", email: nil, password: "password123")
    assert_not teacher.valid?
    assert_includes teacher.errors[:email], "can't be blank"
  end

  test "validates email uniqueness" do
    teacher = Teacher.new(name: "Test", email: teachers(:teacher_alice).email, password: "password123")
    assert_not teacher.valid?
    assert_includes teacher.errors[:email], "has already been taken"
  end

  test "validates email format" do
    teacher = Teacher.new(name: "Test", email: "not-an-email", password: "password123")
    assert_not teacher.valid?
    assert_includes teacher.errors[:email], "is invalid"
  end

  test "validates password minimum length" do
    teacher = Teacher.new(name: "Test", email: "new@test.com", password: "short")
    assert_not teacher.valid?
    assert teacher.errors[:password].any? { |e| e.include?("too short") }
  end

  test "accepts valid password of 8 characters" do
    teacher = Teacher.new(name: "Test", email: "new@test.com", password: "12345678", password_confirmation: "12345678")
    assert teacher.valid?
  end

  test "devise authenticates with valid_password?" do
    teacher = teachers(:teacher_alice)
    assert teacher.valid_password?("password123")
    assert_not teacher.valid_password?("wrongpassword")
  end

  test "role returns teacher" do
    assert_equal "teacher", teachers(:teacher_alice).role
  end

  test "teacher? returns true" do
    assert teachers(:teacher_alice).teacher?
  end

  test "parent? returns false" do
    assert_not teachers(:teacher_alice).parent?
  end

  test "teacher has classrooms" do
    teacher = teachers(:teacher_alice)
    assert_includes teacher.classrooms, classrooms(:alice_class)
  end

  test "jwt_payload includes sub and type" do
    teacher = teachers(:teacher_alice)
    payload = teacher.jwt_payload
    assert_equal teacher.id, payload["sub"]
    assert_equal "Teacher", payload["type"]
  end
end
