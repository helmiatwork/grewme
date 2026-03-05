# frozen_string_literal: true

require "test_helper"

class AdminPermissionsMutationTest < ActiveSupport::TestCase
  GRANT_MUTATION = <<~GRAPHQL
    mutation($userId: ID!, $userType: String!, $resource: String!, $action: String!) {
      grantPermission(userId: $userId, userType: $userType, resource: $resource, action: $action) {
        permission { id resource action granted }
        errors { message path }
      }
    }
  GRAPHQL

  DELETE_MUTATION = <<~GRAPHQL
    mutation($id: ID!) {
      deletePermission(id: $id) {
        success
        errors { message path }
      }
    }
  GRAPHQL

  test "non-admin cannot grant permission" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: GRANT_MUTATION,
      variables: {
        userId: teacher.id.to_s,
        userType: "Teacher",
        resource: "students",
        action: "create"
      },
      user: teacher
    )

    assert_not_nil gql_errors(result)
    assert_match "Not authorized", gql_errors(result).first["message"]
  end

  test "non-admin cannot delete permission" do
    teacher = teachers(:teacher_alice)
    perm = Permission.create!(permissionable: teacher, resource: "classrooms", action: "destroy", granted: true)
    result = execute_query(
      mutation: DELETE_MUTATION,
      variables: { id: perm.id.to_s },
      user: teacher
    )

    assert_not_nil gql_errors(result)
    assert_match "Not authorized", gql_errors(result).first["message"]
  end

  test "unauthenticated user cannot grant permission" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: GRANT_MUTATION,
      variables: {
        userId: teacher.id.to_s,
        userType: "Teacher",
        resource: "students",
        action: "create"
      }
    )

    assert_not_nil gql_errors(result)
  end
end
