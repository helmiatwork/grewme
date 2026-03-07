# frozen_string_literal: true

require "test_helper"

class RegisterMutationTest < ActiveSupport::TestCase
  REGISTER_MUTATION = <<~GRAPHQL
    mutation($input: RegisterInput!) {
      register(input: $input) {
        accessToken refreshToken
        user { ... on Teacher { id name role } ... on Parent { id name role } }
        errors { message path }
      }
    }
  GRAPHQL

  # === Token-required enforcement ===

  test "rejects registration without any token" do
    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "No Token",
          password: "password123",
          passwordConfirmation: "password123"
        }
      }
    )

    data = gql_data(result)["register"]
    assert_not_empty data["errors"]
    assert_equal "token", data["errors"].first["path"].first
  end

  # === Invitation-based registration ===

  test "registers teacher via valid invitation token" do
    invitation = invitations(:pending_invite)

    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "New Teacher",
          password: "password123",
          passwordConfirmation: "password123",
          invitationToken: invitation.token
        }
      }
    )

    data = gql_data(result)["register"]
    assert_empty data["errors"]
    assert_not_nil data["accessToken"]
    assert_equal "New Teacher", data["user"]["name"]
    assert_equal "teacher", data["user"]["role"]

    invitation.reload
    assert invitation.accepted?
  end

  test "rejects registration with invalid invitation token" do
    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "Bad Token",
          password: "password123",
          passwordConfirmation: "password123",
          invitationToken: "nonexistent_token"
        }
      }
    )

    data = gql_data(result)["register"]
    assert_not_empty data["errors"]
    assert_includes data["errors"].first["message"], "Invalid invitation token"
  end

  test "rejects registration with expired invitation token" do
    invitation = invitations(:expired_invite)

    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "Expired",
          password: "password123",
          passwordConfirmation: "password123",
          invitationToken: invitation.token
        }
      }
    )

    data = gql_data(result)["register"]
    assert_not_empty data["errors"]
    assert_includes data["errors"].first["message"], "expired"
  end

  test "rejects registration with already-accepted invitation" do
    invitation = invitations(:accepted_invite)

    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "Already Used",
          password: "password123",
          passwordConfirmation: "password123",
          invitationToken: invitation.token
        }
      }
    )

    data = gql_data(result)["register"]
    assert_not_empty data["errors"]
  end

  # === Consent-based registration ===

  test "registers parent via valid consent token" do
    student = students(:student_emma)
    consent = Consent.create!(
      student: student,
      parent_email: "newparent@test.com",
      consent_method: "email_plus"
    )

    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "New Parent",
          password: "password123",
          passwordConfirmation: "password123",
          consentToken: consent.token
        }
      }
    )

    data = gql_data(result)["register"]
    assert_empty data["errors"]
    assert_not_nil data["accessToken"]
    assert_equal "New Parent", data["user"]["name"]
    assert_equal "parent", data["user"]["role"]

    consent.reload
    assert consent.granted?
    assert_not_nil consent.parent
  end

  test "rejects registration with invalid consent token" do
    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "Bad Consent",
          password: "password123",
          passwordConfirmation: "password123",
          consentToken: "nonexistent_token"
        }
      }
    )

    data = gql_data(result)["register"]
    assert_not_empty data["errors"]
    assert_includes data["errors"].first["message"], "Invalid consent token"
  end

  test "returns errors for password mismatch with invitation" do
    invitation = invitations(:pending_invite)

    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "Mismatch",
          password: "password123",
          passwordConfirmation: "different",
          invitationToken: invitation.token
        }
      }
    )

    data = gql_data(result)["register"]
    assert_not_empty data["errors"]
  end
end
