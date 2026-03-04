require "test_helper"

class Api::V1::AuthControllerTest < ActionDispatch::IntegrationTest
  # === LOGIN ===

  test "login with valid credentials returns 200 with tokens" do
    post api_v1_auth_login_path, params: { email: "alice@school.test", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :ok
    body = JSON.parse(response.body)
    assert_not_nil body["access_token"]
    assert_not_nil body["refresh_token"]
    assert_not_nil body["expires_in"]
    assert_not_nil body["user"]
    assert_equal "alice@school.test", body["user"]["email"]
  end

  test "login with invalid email returns 401" do
    post api_v1_auth_login_path, params: { email: "nobody@test.com", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
    body = JSON.parse(response.body)
    assert_equal "invalid_credentials", body["error"]["code"]
  end

  test "login with wrong password returns 401" do
    post api_v1_auth_login_path, params: { email: "alice@school.test", password: "wrongpassword" }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
  end

  # === REGISTER ===

  test "register with valid params creates user and returns 201" do
    assert_difference "User.count", 1 do
      post api_v1_auth_register_path, params: {
        name: "New User", email: "new@test.com", password: "password123", password_confirmation: "password123"
      }.to_json, headers: { "Content-Type" => "application/json" }
    end
    assert_response :created
    body = JSON.parse(response.body)
    assert_not_nil body["access_token"]
    assert_not_nil body["refresh_token"]
    assert_equal "New User", body["user"]["name"]
  end

  test "register ignores role param and defaults to teacher" do
    post api_v1_auth_register_path, params: {
      name: "Hacker", email: "hacker@test.com", password: "password123", password_confirmation: "password123", role: "admin"
    }.to_json, headers: { "Content-Type" => "application/json" }
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "teacher", body["user"]["role"]
  end

  test "register with short password returns 422" do
    post api_v1_auth_register_path, params: {
      name: "Short", email: "short@test.com", password: "short", password_confirmation: "short"
    }.to_json, headers: { "Content-Type" => "application/json" }
    assert_response :unprocessable_entity
  end

  test "register with duplicate email returns 422" do
    post api_v1_auth_register_path, params: {
      name: "Dup", email: "alice@school.test", password: "password123", password_confirmation: "password123"
    }.to_json, headers: { "Content-Type" => "application/json" }
    assert_response :unprocessable_entity
  end

  # === REFRESH ===

  test "refresh with valid token returns new token pair" do
    # Login first to get a refresh token
    post api_v1_auth_login_path, params: { email: "alice@school.test", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    login_body = JSON.parse(response.body)
    refresh_token = login_body["refresh_token"]

    # Use refresh token
    post api_v1_auth_refresh_path, params: { refresh_token: refresh_token }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :ok
    body = JSON.parse(response.body)
    assert_not_nil body["access_token"]
    assert_not_nil body["refresh_token"]
    assert_not_equal refresh_token, body["refresh_token"]
  end

  test "refresh with used token returns 401 (rotation)" do
    # Login to get refresh token
    post api_v1_auth_login_path, params: { email: "alice@school.test", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    refresh_token = JSON.parse(response.body)["refresh_token"]

    # Use it once
    post api_v1_auth_refresh_path, params: { refresh_token: refresh_token }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :ok

    # Use it again — should fail
    post api_v1_auth_refresh_path, params: { refresh_token: refresh_token }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
  end

  test "refresh with missing token returns 400" do
    post api_v1_auth_refresh_path, params: {}.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :bad_request
  end

  test "refresh with invalid token returns 401" do
    post api_v1_auth_refresh_path, params: { refresh_token: "invalid-token" }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
  end

  # === UNAUTHENTICATED ===

  test "accessing protected endpoint without auth returns 401" do
    get api_v1_classrooms_path
    assert_response :unauthorized
  end
end
