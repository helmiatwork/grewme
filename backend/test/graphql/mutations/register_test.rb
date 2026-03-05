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

  test "registers a new teacher" do
    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "New Teacher",
          email: "newteacher@school.test",
          password: "password123",
          passwordConfirmation: "password123",
          role: "teacher"
        }
      }
    )

    data = gql_data(result)["register"]
    assert_empty data["errors"]
    assert_not_nil data["accessToken"]
    assert_equal "New Teacher", data["user"]["name"]
    assert_equal "teacher", data["user"]["role"]
  end

  test "registers a new parent" do
    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "New Parent",
          email: "newparent@parent.test",
          password: "password123",
          passwordConfirmation: "password123",
          role: "parent"
        }
      }
    )

    data = gql_data(result)["register"]
    assert_empty data["errors"]
    assert_equal "parent", data["user"]["role"]
  end

  test "returns errors for duplicate email" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "Duplicate",
          email: teacher.email,
          password: "password123",
          passwordConfirmation: "password123",
          role: "teacher"
        }
      }
    )

    data = gql_data(result)["register"]
    assert_not_empty data["errors"]
  end

  test "returns errors for password mismatch" do
    result = execute_query(
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          name: "Mismatch",
          email: "mismatch@school.test",
          password: "password123",
          passwordConfirmation: "different",
          role: "teacher"
        }
      }
    )

    data = gql_data(result)["register"]
    assert_not_empty data["errors"]
  end
end
