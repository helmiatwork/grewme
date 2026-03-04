require "test_helper"

class ParentTest < ActiveSupport::TestCase
  test "validates name presence" do
    parent = Parent.new(name: nil, email: "test@test.com", password: "password123")
    assert_not parent.valid?
    assert_includes parent.errors[:name], "can't be blank"
  end

  test "validates email presence" do
    parent = Parent.new(name: "Test", email: nil, password: "password123")
    assert_not parent.valid?
    assert_includes parent.errors[:email], "can't be blank"
  end

  test "validates email uniqueness" do
    parent = Parent.new(name: "Test", email: parents(:parent_carol).email, password: "password123")
    assert_not parent.valid?
    assert_includes parent.errors[:email], "has already been taken"
  end

  test "role returns parent" do
    assert_equal "parent", parents(:parent_carol).role
  end

  test "parent? returns true" do
    assert parents(:parent_carol).parent?
  end

  test "teacher? returns false" do
    assert_not parents(:parent_carol).teacher?
  end

  test "parent has children" do
    parent = parents(:parent_carol)
    assert_includes parent.children, students(:student_emma)
  end

  test "jwt_payload includes sub and type" do
    parent = parents(:parent_carol)
    payload = parent.jwt_payload
    assert_equal parent.id, payload["sub"]
    assert_equal "Parent", payload["type"]
  end
end
