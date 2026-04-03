require "test_helper"

class AdminUserTest < ActiveSupport::TestCase
  test "valid admin user with email and password" do
    admin = AdminUser.new(email: "newadmin@grewme.test", password: "password123")
    assert admin.valid?
  end

  test "validates email presence" do
    admin = AdminUser.new(email: nil, password: "password123")
    assert_not admin.valid?
    assert_includes admin.errors[:email], "can't be blank"
  end

  test "validates email uniqueness" do
    admin = AdminUser.new(email: admin_users(:admin_one).email, password: "password123")
    assert_not admin.valid?
    assert_includes admin.errors[:email], "has already been taken"
  end

  test "validates password length" do
    admin = AdminUser.new(email: "short@grewme.test", password: "abc")
    assert_not admin.valid?
  end

  test "fixture admin_one loads correctly" do
    admin = admin_users(:admin_one)
    assert_not_nil admin.email
    assert admin.persisted?
  end
end
