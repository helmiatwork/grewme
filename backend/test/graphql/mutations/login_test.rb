# frozen_string_literal: true

require "test_helper"

class LoginMutationTest < ActiveSupport::TestCase
  LOGIN_MUTATION = <<~GRAPHQL
    mutation($email: String!, $password: String!, $role: String!) {
      login(email: $email, password: $password, role: $role) {
        accessToken refreshToken expiresIn
        user { ... on Teacher { id name role } ... on Parent { id name role } }
        errors { message path }
      }
    }
  GRAPHQL

  test "logs in teacher with valid credentials" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: LOGIN_MUTATION,
      variables: { email: teacher.email, password: "password123", role: "teacher" }
    )

    data = gql_data(result)["login"]
    assert_empty data["errors"]
    assert_not_nil data["accessToken"]
    assert_not_nil data["refreshToken"]
    assert_equal teacher.name, data["user"]["name"]
    assert_equal "teacher", data["user"]["role"]
  end

  test "logs in parent with valid credentials" do
    parent = parents(:parent_carol)
    result = execute_query(
      mutation: LOGIN_MUTATION,
      variables: { email: parent.email, password: "password123", role: "parent" }
    )

    data = gql_data(result)["login"]
    assert_empty data["errors"]
    assert_not_nil data["accessToken"]
    assert_equal "parent", data["user"]["role"]
  end

  test "returns error with invalid credentials" do
    result = execute_query(
      mutation: LOGIN_MUTATION,
      variables: { email: "wrong@example.com", password: "wrong", role: "teacher" }
    )

    data = gql_data(result)["login"]
    assert_not_empty data["errors"]
    assert_match "Invalid email or password", data["errors"].first["message"]
  end

  test "returns error with wrong password" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: LOGIN_MUTATION,
      variables: { email: teacher.email, password: "wrongpassword", role: "teacher" }
    )

    data = gql_data(result)["login"]
    assert_not_empty data["errors"]
  end
end
