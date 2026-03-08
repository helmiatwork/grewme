# frozen_string_literal: true

require "test_helper"

class InvitationFlowTest < ActiveSupport::TestCase
  CREATE_INVITATION = <<~GQL
    mutation($email: String!, $role: String!) {
      createInvitation(email: $email, role: $role) {
        invitation { id token email status }
        errors { message path }
      }
    }
  GQL

  ACCEPT_INVITATION = <<~GQL
    mutation($token: String!, $name: String!, $password: String!, $passwordConfirmation: String!) {
      acceptInvitation(token: $token, name: $name, password: $password, passwordConfirmation: $passwordConfirmation) {
        accessToken
        user { ... on Teacher { id name role } }
        errors { message path }
      }
    }
  GQL

  SCHOOL_INVITATIONS = <<~GQL
    { schoolInvitations { id email status } }
  GQL

  test "full invitation flow: create → list → accept → teacher linked to school" do
    manager = school_managers(:manager_pat)

    # Step 1: School manager creates invitation
    result = execute_query(
      mutation: CREATE_INVITATION,
      variables: { email: "newteacher@flow.test", role: "teacher" },
      user: manager
    )
    data = gql_data(result)["createInvitation"]
    assert_empty data["errors"]
    token = data["invitation"]["token"]
    assert_equal "pending", data["invitation"]["status"]

    # Step 2: School manager can see invitation in list
    list_result = execute_query(query: SCHOOL_INVITATIONS, user: manager)
    emails = gql_data(list_result)["schoolInvitations"].map { |i| i["email"] }
    assert_includes emails, "newteacher@flow.test"

    # Step 3: Teacher accepts invitation
    accept_result = execute_query(
      mutation: ACCEPT_INVITATION,
      variables: {
        token: token,
        name: "New Flow Teacher",
        password: "password123",
        passwordConfirmation: "password123"
      }
    )
    accept_data = gql_data(accept_result)["acceptInvitation"]
    assert_empty accept_data["errors"]
    assert_not_nil accept_data["accessToken"]
    assert_equal "New Flow Teacher", accept_data["user"]["name"]
    assert_equal "teacher", accept_data["user"]["role"]

    # Step 4: Verify invitation is now accepted
    invitation = Invitation.find_by!(token: token).reload
    assert invitation.accepted?

    # Step 5: Verify teacher is linked to school
    teacher = Teacher.find_by(email: "newteacher@flow.test")
    assert_not_nil teacher
    assert_equal manager.school, teacher.school

    # Step 6: Verify audit logs were created
    assert AuditLog.exists?(event_type: "INVITATION_SENT")
  end
end
