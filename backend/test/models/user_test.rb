require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "validates name presence" do
    user = User.new(name: nil, email: "test@test.com", password: "password123", role: :teacher)
    assert_not user.valid?
    assert_includes user.errors[:name], "can't be blank"
  end

  test "validates email presence" do
    user = User.new(name: "Test", email: nil, password: "password123", role: :teacher)
    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test "validates email uniqueness" do
    user = User.new(name: "Test", email: users(:teacher_alice).email, password: "password123", role: :teacher)
    assert_not user.valid?
    assert_includes user.errors[:email], "has already been taken"
  end

  test "validates email format" do
    user = User.new(name: "Test", email: "not-an-email", password: "password123", role: :teacher)
    assert_not user.valid?
    assert_includes user.errors[:email], "is invalid"
  end

  test "validates password minimum length" do
    user = User.new(name: "Test", email: "new@test.com", password: "short", role: :teacher)
    assert_not user.valid?
    assert_includes user.errors[:password], "is too short (minimum is 8 characters)"
  end

  test "accepts valid password of 8 characters" do
    user = User.new(name: "Test", email: "new@test.com", password: "12345678", password_confirmation: "12345678", role: :teacher)
    assert user.valid?
  end

  test "has_secure_password authenticates" do
    user = users(:teacher_alice)
    assert user.authenticate("password123")
    assert_not user.authenticate("wrongpassword")
  end

  test "role enum defines teacher parent admin" do
    assert_equal({ "teacher" => 0, "parent" => 1, "admin" => 2 }, User.roles)
  end

  test "teacher has classrooms" do
    teacher = users(:teacher_alice)
    assert_includes teacher.classrooms, classrooms(:alice_class)
  end

  test "parent has children" do
    parent = users(:parent_carol)
    assert_includes parent.children, students(:student_emma)
  end
end
