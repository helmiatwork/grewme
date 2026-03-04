require "test_helper"

class PermissionableTest < ActiveSupport::TestCase
  test "teacher has default classroom index permission" do
    teacher = users(:teacher_alice)
    assert teacher.has_permission?("classrooms", "index")
  end

  test "teacher does not have default classroom destroy permission" do
    teacher = users(:teacher_alice)
    assert_not teacher.has_permission?("classrooms", "destroy")
  end

  test "parent has default children index permission" do
    parent = users(:parent_carol)
    assert parent.has_permission?("children", "index")
  end

  test "parent does not have default daily_scores create permission" do
    parent = users(:parent_carol)
    assert_not parent.has_permission?("daily_scores", "create")
  end

  test "admin has permission for everything" do
    admin = users(:admin_dave)
    assert admin.has_permission?("classrooms", "destroy")
    assert admin.has_permission?("students", "create")
    assert admin.has_permission?("daily_scores", "update")
  end

  test "override grants extra permission" do
    parent = users(:parent_carol)
    assert_not parent.has_permission?("daily_scores", "create")

    Permission.create!(user: parent, resource: "daily_scores", action: "create", granted: true)
    parent.reload
    assert parent.has_permission?("daily_scores", "create")
  end

  test "override revokes default permission" do
    teacher = users(:teacher_alice)
    assert teacher.has_permission?("classrooms", "index")

    Permission.create!(user: teacher, resource: "classrooms", action: "index", granted: false)
    teacher.reload
    assert_not teacher.has_permission?("classrooms", "index")
  end

  test "role_allows checks role defaults only" do
    teacher = users(:teacher_alice)
    assert teacher.role_allows?("classrooms", "index")
    assert_not teacher.role_allows?("classrooms", "destroy")
  end

  test "effective_permissions includes defaults and overrides" do
    teacher = users(:teacher_alice)
    Permission.create!(user: teacher, resource: "classrooms", action: "destroy", granted: true)
    Permission.create!(user: teacher, resource: "classrooms", action: "index", granted: false)

    effective = teacher.effective_permissions
    assert_equal true, effective["classrooms"]["destroy"]
    assert_equal false, effective["classrooms"]["index"]
    assert_equal true, effective["classrooms"]["show"]
  end
end
