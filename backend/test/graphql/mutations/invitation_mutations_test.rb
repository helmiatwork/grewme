require "test_helper"

class InvitationMutationsTest < ActiveSupport::TestCase
  fixtures :all

  # === createInvitation ===

  test "school manager creates invitation successfully" do
    assert_difference "Invitation.count", 1 do
      result = execute_query(
        mutation: 'mutation($email: String!, $role: String!) {
          createInvitation(email: $email, role: $role) {
            invitation { id email role status }
            errors { message }
          }
        }',
        variables: { email: "newteacher@example.com", role: "teacher" },
        user: school_managers(:manager_pat)
      )

      inv = result.dig("data", "createInvitation", "invitation")
      errors = result.dig("data", "createInvitation", "errors")
      assert_empty errors
      assert_equal "newteacher@example.com", inv["email"]
      assert_equal "teacher", inv["role"]
      assert_equal "pending", inv["status"]
    end
  end

  test "non-school-manager cannot create invitation" do
    result = execute_query(
      mutation: 'mutation($email: String!, $role: String!) {
        createInvitation(email: $email, role: $role) {
          invitation { id }
          errors { message }
        }
      }',
      variables: { email: "newteacher@example.com", role: "teacher" },
      user: teachers(:teacher_alice)
    )

    assert result["errors"].any? { |e| e["message"].include?("school manager") }
  end

  # === acceptInvitation ===

  test "valid token creates teacher account" do
    token = invitations(:pending_invite).token

    result = execute_query(
      mutation: 'mutation($token: String!, $name: String!, $password: String!, $passwordConfirmation: String!) {
        acceptInvitation(token: $token, name: $name, password: $password, passwordConfirmation: $passwordConfirmation) {
          accessToken
          user { ... on Teacher { id name email } }
          errors { message }
        }
      }',
      variables: {
        token: token,
        name: "New Teacher",
        password: "password123",
        passwordConfirmation: "password123"
      },
      user: nil
    )

    errors = result.dig("data", "acceptInvitation", "errors")
    assert_empty errors
    assert_not_nil result.dig("data", "acceptInvitation", "accessToken")
    assert_equal "New Teacher", result.dig("data", "acceptInvitation", "user", "name")

    # Invitation should be accepted
    assert invitations(:pending_invite).reload.accepted?
  end

  test "invalid token returns error" do
    result = execute_query(
      mutation: 'mutation($token: String!, $name: String!, $password: String!, $passwordConfirmation: String!) {
        acceptInvitation(token: $token, name: $name, password: $password, passwordConfirmation: $passwordConfirmation) {
          accessToken
          errors { message }
        }
      }',
      variables: {
        token: "invalidtoken",
        name: "New Teacher",
        password: "password123",
        passwordConfirmation: "password123"
      },
      user: nil
    )

    errors = result.dig("data", "acceptInvitation", "errors")
    assert errors.any? { |e| e["message"].include?("Invalid invitation token") }
  end

  test "expired invitation returns error" do
    result = execute_query(
      mutation: 'mutation($token: String!, $name: String!, $password: String!, $passwordConfirmation: String!) {
        acceptInvitation(token: $token, name: $name, password: $password, passwordConfirmation: $passwordConfirmation) {
          accessToken
          errors { message }
        }
      }',
      variables: {
        token: invitations(:expired_invite).token,
        name: "New Teacher",
        password: "password123",
        passwordConfirmation: "password123"
      },
      user: nil
    )

    errors = result.dig("data", "acceptInvitation", "errors")
    assert errors.any? { |e| e["message"].include?("expired") }
  end

  # === revokeInvitation ===

  test "school manager revokes invitation" do
    inv = invitations(:pending_invite)

    result = execute_query(
      mutation: 'mutation($id: ID!) {
        revokeInvitation(id: $id) {
          invitation { id status }
          errors { message }
        }
      }',
      variables: { id: inv.id.to_s },
      user: school_managers(:manager_pat)
    )

    errors = result.dig("data", "revokeInvitation", "errors")
    assert_empty errors
    assert_equal "revoked", result.dig("data", "revokeInvitation", "invitation", "status")
    assert inv.reload.revoked?
  end

  # === schoolInvitations query ===

  test "school manager lists invitations" do
    result = execute_query(
      query: "{ schoolInvitations { id email role status } }",
      user: school_managers(:manager_pat)
    )

    invitations = result.dig("data", "schoolInvitations")
    assert_not_nil invitations
    assert invitations.is_a?(Array)
  end

  test "teacher cannot list school invitations" do
    result = execute_query(
      query: "{ schoolInvitations { id email } }",
      user: teachers(:teacher_alice)
    )

    assert result["errors"].any? { |e| e["message"].include?("school manager") }
  end
end
