require "test_helper"

class Api::V1::Admin::PermissionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:admin_dave)
    @teacher = users(:teacher_alice)
  end

  test "admin lists user permissions" do
    auth_get api_v1_admin_user_permissions_path(@teacher), user: @admin
    assert_response :ok
    body = JSON.parse(response.body)
    assert_equal @teacher.id, body["user_id"]
    assert_equal "teacher", body["role"]
    assert body.key?("effective")
  end

  test "non-admin cannot list permissions" do
    auth_get api_v1_admin_user_permissions_path(@teacher), user: @teacher
    assert_response :forbidden
  end

  test "admin grants extra permission" do
    assert_difference "Permission.count", 1 do
      auth_post api_v1_admin_user_permissions_path(@teacher), user: @admin, params: {
        permission: { resource: "classrooms", action: "destroy", granted: true }
      }
    end
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "classrooms", body["permission"]["resource"]
    assert_equal "destroy", body["permission"]["action"]
    assert_equal true, body["permission"]["granted"]
  end

  test "admin revokes default permission" do
    assert_difference "Permission.count", 1 do
      auth_post api_v1_admin_user_permissions_path(@teacher), user: @admin, params: {
        permission: { resource: "classrooms", action: "index", granted: false }
      }
    end
    assert_response :created
    @teacher.reload
    assert_not @teacher.has_permission?("classrooms", "index")
  end

  test "admin cannot create duplicate permission" do
    Permission.create!(user: @teacher, resource: "classrooms", action: "destroy", granted: true)
    auth_post api_v1_admin_user_permissions_path(@teacher), user: @admin, params: {
      permission: { resource: "classrooms", action: "destroy", granted: false }
    }
    assert_response :unprocessable_entity
  end

  test "non-admin cannot create permission" do
    auth_post api_v1_admin_user_permissions_path(@teacher), user: @teacher, params: {
      permission: { resource: "classrooms", action: "destroy", granted: true }
    }
    assert_response :forbidden
  end

  test "admin toggles permission" do
    perm = Permission.create!(user: @teacher, resource: "classrooms", action: "destroy", granted: true)
    auth_put api_v1_admin_user_permission_path(@teacher, perm), user: @admin, params: {
      permission: { granted: false }
    }
    assert_response :ok
    perm.reload
    assert_not perm.granted?
  end

  test "admin removes override" do
    perm = Permission.create!(user: @teacher, resource: "classrooms", action: "destroy", granted: true)
    assert_difference "Permission.count", -1 do
      auth_delete api_v1_admin_user_permission_path(@teacher, perm), user: @admin
    end
    assert_response :no_content
  end

  test "non-admin cannot delete permission" do
    perm = Permission.create!(user: @teacher, resource: "classrooms", action: "destroy", granted: true)
    auth_delete api_v1_admin_user_permission_path(@teacher, perm), user: @teacher
    assert_response :forbidden
  end
end
