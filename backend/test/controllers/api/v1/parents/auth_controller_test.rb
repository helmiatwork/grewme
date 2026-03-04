require "test_helper"

class Api::V1::Parents::AuthControllerTest < ActionDispatch::IntegrationTest
  test "login with valid credentials returns 200 with tokens" do
    post api_v1_parents_auth_login_path, params: { email: "carol@parent.test", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :ok
    body = JSON.parse(response.body)
    assert_not_nil body["access_token"]
    assert_equal "parent", body["user"]["role"]
  end

  test "login with invalid credentials returns 401" do
    post api_v1_parents_auth_login_path, params: { email: "carol@parent.test", password: "wrong" }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
  end

  test "register creates parent and returns 201" do
    assert_difference "Parent.count", 1 do
      post api_v1_parents_auth_register_path, params: {
        name: "New Parent", email: "newparent@test.com", password: "password123", password_confirmation: "password123"
      }.to_json, headers: { "Content-Type" => "application/json" }
    end
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "parent", body["user"]["role"]
  end

  test "refresh with valid token returns new token pair" do
    post api_v1_parents_auth_login_path, params: { email: "carol@parent.test", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    refresh_token = JSON.parse(response.body)["refresh_token"]

    post api_v1_parents_auth_refresh_path, params: { refresh_token: refresh_token }.to_json,
      headers: { "Content-Type" => "application/json" }
    assert_response :ok
    body = JSON.parse(response.body)
    assert_not_nil body["access_token"]
  end

  test "logout revokes JWT and returns success" do
    post api_v1_parents_auth_login_path, params: { email: "carol@parent.test", password: "password123" }.to_json,
      headers: { "Content-Type" => "application/json" }
    body = JSON.parse(response.body)
    token = body["access_token"]

    delete api_v1_parents_auth_logout_path, headers: { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" }
    assert_response :ok
  end
end
