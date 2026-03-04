require "test_helper"

class PermissionTest < ActiveSupport::TestCase
  setup do
    @teacher = teachers(:teacher_alice)
  end

  test "valid permission" do
    perm = Permission.new(permissionable: @teacher, resource: "classrooms", action: "destroy", granted: true)
    assert perm.valid?
  end

  test "requires permissionable" do
    perm = Permission.new(resource: "classrooms", action: "index")
    assert_not perm.valid?
    assert_includes perm.errors[:permissionable], "must exist"
  end

  test "requires resource" do
    perm = Permission.new(permissionable: @teacher, resource: nil, action: "index")
    assert_not perm.valid?
    assert_includes perm.errors[:resource], "can't be blank"
  end

  test "requires action" do
    perm = Permission.new(permissionable: @teacher, resource: "classrooms", action: nil)
    assert_not perm.valid?
    assert_includes perm.errors[:action], "can't be blank"
  end

  test "validates resource inclusion" do
    perm = Permission.new(permissionable: @teacher, resource: "invalid", action: "index")
    assert_not perm.valid?
    assert_includes perm.errors[:resource], "is not included in the list"
  end

  test "validates action inclusion" do
    perm = Permission.new(permissionable: @teacher, resource: "classrooms", action: "invalid")
    assert_not perm.valid?
    assert_includes perm.errors[:action], "is not included in the list"
  end

  test "enforces uniqueness of permissionable resource action" do
    Permission.create!(permissionable: @teacher, resource: "classrooms", action: "destroy", granted: true)
    dup = Permission.new(permissionable: @teacher, resource: "classrooms", action: "destroy", granted: false)
    assert_not dup.valid?
    assert_includes dup.errors[:action], "already exists for this user and resource"
  end

  test "grants scope" do
    Permission.create!(permissionable: @teacher, resource: "classrooms", action: "destroy", granted: true)
    Permission.create!(permissionable: @teacher, resource: "students", action: "create", granted: false)
    assert_equal 1, @teacher.permissions.grants.count
    assert_equal 1, @teacher.permissions.revocations.count
  end

  test "for_resource scope" do
    Permission.create!(permissionable: @teacher, resource: "classrooms", action: "destroy", granted: true)
    Permission.create!(permissionable: @teacher, resource: "students", action: "create", granted: true)
    assert_equal 1, @teacher.permissions.for_resource("classrooms").count
  end

  test "default granted is true" do
    perm = Permission.create!(permissionable: @teacher, resource: "classrooms", action: "destroy")
    assert perm.granted?
  end
end
