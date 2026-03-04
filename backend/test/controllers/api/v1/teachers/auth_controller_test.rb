require "test_helper"

class Api::V1::Teachers::AuthControllerTest < ActionDispatch::IntegrationTest
  # === LOGIN ===

  test "login with valid credentials returns 200 with tokens" do
    post api_v1_teachers_auth_login_path, params: { email: "alice@school.test", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :ok
    body = JSON.parse(response.body)
    assert_not_nil body["access_token"]
    assert_not_nil body["refresh_token"]
    assert_not_nil body["expires_in"]
    assert_not_nil body["user"]
    assert_equal "alice@school.test", body["user"]["email"]
    assert_equal "teacher", body["user"]["role"]
  end

  test "login with invalid email returns 401" do
    post api_v1_teachers_auth_login_path, params: { email: "nobody@test.com", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
    body = JSON.parse(response.body)
    assert_equal "invalid_credentials", body["error"]["code"]
  end

  test "login with wrong password returns 401" do
    post api_v1_teachers_auth_login_path, params: { email: "alice@school.test", password: "wrongpassword" }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
  end

  # === REGISTER ===

  test "register with valid params creates teacher and returns 201" do
    assert_difference "Teacher.count", 1 do
      post api_v1_teachers_auth_register_path, params: {
        name: "New Teacher", email: "new@test.com", password: "password123", password_confirmation: "password123"
      }.to_json, headers: { "Content-Type" => "application/json" }
    end
    assert_response :created
    body = JSON.parse(response.body)
    assert_not_nil body["access_token"]
    assert_not_nil body["refresh_token"]
    assert_equal "New Teacher", body["user"]["name"]
    assert_equal "teacher", body["user"]["role"]
  end

  test "register with short password returns 422" do
    post api_v1_teachers_auth_register_path, params: {
      name: "Short", email: "short@test.com", password: "short", password_confirmation: "short"
    }.to_json, headers: { "Content-Type" => "application/json" }
    assert_response :unprocessable_entity
  end

  test "register with duplicate email returns 422" do
    post api_v1_teachers_auth_register_path, params: {
      name: "Dup", email: "alice@school.test", password: "password123", password_confirmation: "password123"
    }.to_json, headers: { "Content-Type" => "application/json" }
    assert_response :unprocessable_entity
  end

  # === REFRESH ===

  test "refresh with valid token returns new token pair" do
    post api_v1_teachers_auth_login_path, params: { email: "alice@school.test", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    login_body = JSON.parse(response.body)
    refresh_token = login_body["refresh_token"]

    post api_v1_teachers_auth_refresh_path, params: { refresh_token: refresh_token }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :ok
    body = JSON.parse(response.body)
    assert_not_nil body["access_token"]
    assert_not_nil body["refresh_token"]
    assert_not_equal refresh_token, body["refresh_token"]
  end

  test "refresh with used token returns 401 (rotation)" do
    post api_v1_teachers_auth_login_path, params: { email: "alice@school.test", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    refresh_token = JSON.parse(response.body)["refresh_token"]

    post api_v1_teachers_auth_refresh_path, params: { refresh_token: refresh_token }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :ok

    post api_v1_teachers_auth_refresh_path, params: { refresh_token: refresh_token }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
  end

  test "refresh with missing token returns 400" do
    post api_v1_teachers_auth_refresh_path, params: {}.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :bad_request
  end

  test "refresh with invalid token returns 401" do
    post api_v1_teachers_auth_refresh_path, params: { refresh_token: "invalid-token" }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
  end

  # === LOGOUT ===

  test "logout revokes JWT and returns success" do
    post api_v1_teachers_auth_login_path, params: { email: "alice@school.test", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    body = JSON.parse(response.body)
    token = body["access_token"]

    assert_difference "JwtDenylist.count", 1 do
      delete api_v1_teachers_auth_logout_path, headers: { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" }
    end
    assert_response :ok

    # Token should now be denied
    get api_v1_classrooms_path, headers: { "Authorization" => "Bearer #{token}" }
    assert_response :unauthorized
  end

  # === UNAUTHENTICATED ===

  test "accessing protected endpoint without auth returns 401" do
    get api_v1_classrooms_path
    assert_response :unauthorized
  end
end
