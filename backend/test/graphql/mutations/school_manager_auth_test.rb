require "test_helper"

class SchoolManagerAuthTest < ActiveSupport::TestCase
  test "school manager can log in" do
    SchoolManager.create!(
      name: "Pat Principal",
      email: "pat@greenwood.edu",
      password: "password123",
      password_confirmation: "password123",
      school: schools(:greenwood)
    )

    result = execute_query(
      mutation: 'mutation($email: String!, $password: String!, $role: String!) {
        login(email: $email, password: $password, role: $role) {
          accessToken
          refreshToken
          expiresIn
          user { ... on SchoolManager { id name email role } }
          errors { message }
        }
      }',
      variables: { email: "pat@greenwood.edu", password: "password123", role: "school_manager" }
    )

    data = result.dig("data", "login")
    assert_not_nil data["accessToken"]
    assert_not_nil data["refreshToken"]
    assert_empty data["errors"]

    user = data["user"]
    assert_equal "Pat Principal", user["name"]
    assert_equal "school_manager", user["role"]
  end

  test "school manager login with wrong password fails" do
    SchoolManager.create!(
      name: "Pat Principal",
      email: "pat@greenwood.edu",
      password: "password123",
      password_confirmation: "password123",
      school: schools(:greenwood)
    )

    result = execute_query(
      mutation: 'mutation($email: String!, $password: String!, $role: String!) {
        login(email: $email, password: $password, role: $role) {
          accessToken
          errors { message }
        }
      }',
      variables: { email: "pat@greenwood.edu", password: "wrong", role: "school_manager" }
    )

    assert_nil result.dig("data", "login", "accessToken")
    assert result.dig("data", "login", "errors").any?
  end
end
