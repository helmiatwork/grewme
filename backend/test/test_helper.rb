require "simplecov"
SimpleCov.start "rails" do
  enable_coverage :branch
  minimum_coverage 50
  add_filter "/test/"
  add_filter "/config/"
  add_filter "/db/"
end

ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require_relative "support/graphql_test_helper"

module AuthTestHelper
  def auth_headers(user)
    secret = Rails.application.credentials.devise_jwt_secret_key!
    payload = user.jwt_payload.merge(
      "jti" => SecureRandom.uuid,
      "iat" => Time.current.to_i,
      "exp" => 15.minutes.from_now.to_i
    )
    token = JWT.encode(payload, secret, "HS256")
    { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" }
  end

  def auth_get(path, user:, params: {})
    get path, params: params, headers: auth_headers(user)
  end

  def auth_post(path, user:, params: {})
    post path, params: params.to_json, headers: auth_headers(user)
  end

  def auth_put(path, user:, params: {})
    put path, params: params.to_json, headers: auth_headers(user)
  end

  def auth_delete(path, user:)
    delete path, headers: auth_headers(user)
  end
end

module ActiveSupport
  class TestCase
    set_fixture_class rubric_criteria: RubricCriteria
    fixtures :all
    include GraphqlTestHelper

    parallelize(workers: 1)
  end
end

class ActionDispatch::IntegrationTest
  include AuthTestHelper
end
