require "test_helper"

class Api::V1::Admin::PermissionsControllerTest < ActionDispatch::IntegrationTest
  # Note: admin is now a Teacher with admin-like permissions.
  # Since we no longer have an admin role in the DB, we test with teacher permissions.
  # The admin permissions controller requires admin? to return true.
  # For now, we test that non-admin users get forbidden.

  setup do
    @teacher = teachers(:teacher_alice)
  end

  test "non-admin cannot list permissions" do
    auth_get api_v1_admin_teacher_permissions_path(@teacher), user: @teacher
    assert_response :forbidden
  end

  test "non-admin cannot create permission" do
    auth_post api_v1_admin_teacher_permissions_path(@teacher), user: @teacher, params: {
      permission: { resource: "classrooms", action: "destroy", granted: true }
    }
    assert_response :forbidden
  end

  test "non-admin cannot delete permission" do
    perm = Permission.create!(permissionable: @teacher, resource: "classrooms", action: "destroy", granted: true)
    auth_delete api_v1_admin_teacher_permission_path(@teacher, perm), user: @teacher
    assert_response :forbidden
  end
end
