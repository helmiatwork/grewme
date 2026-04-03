require "test_helper"

class SchoolManagerTest < ActiveSupport::TestCase
  test "valid manager loads from fixture" do
    manager = school_managers(:manager_pat)
    assert manager.persisted?
  end

  test "validates name presence" do
    manager = SchoolManager.new(name: nil, email: "mgr@school.test", password: "password123", school: schools(:greenwood))
    assert_not manager.valid?
    assert_includes manager.errors[:name], "can't be blank"
  end

  test "validates email presence" do
    manager = SchoolManager.new(name: "Pat", email: nil, password: "password123", school: schools(:greenwood))
    assert_not manager.valid?
    assert_includes manager.errors[:email], "can't be blank"
  end

  test "validates email uniqueness" do
    existing = school_managers(:manager_pat)
    duplicate = SchoolManager.new(name: "Other", email: existing.email, password: "password123", school: schools(:greenwood))
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:email], "has already been taken"
  end

  test "belongs to school" do
    manager = school_managers(:manager_pat)
    assert_equal schools(:greenwood), manager.school
  end

  test "role returns school_manager" do
    assert_equal "school_manager", school_managers(:manager_pat).role
  end

  test "school_manager? returns true" do
    assert school_managers(:manager_pat).school_manager?
  end

  test "teacher? returns false" do
    assert_not school_managers(:manager_pat).teacher?
  end

  test "parent? returns false" do
    assert_not school_managers(:manager_pat).parent?
  end

  test "admin? returns false" do
    assert_not school_managers(:manager_pat).admin?
  end

  test "jwt_payload includes sub and type" do
    manager = school_managers(:manager_pat)
    payload = manager.jwt_payload
    assert_equal manager.id, payload["sub"]
    assert_equal "SchoolManager", payload["type"]
  end

  test "school_classrooms returns school classrooms" do
    manager = school_managers(:manager_pat)
    assert_equal manager.school.classrooms, manager.school_classrooms
  end

  test "school_classroom_ids returns array of ids" do
    manager = school_managers(:manager_pat)
    assert_equal manager.school.classrooms.pluck(:id), manager.school_classroom_ids
  end
end
