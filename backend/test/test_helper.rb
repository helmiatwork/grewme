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

module AuthTestHelper
  def auth_headers(user)
    token = JwtService.encode({ user_id: user.id })
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
    fixtures :all
    parallelize(workers: :number_of_processors)
  end
end

class ActionDispatch::IntegrationTest
  include AuthTestHelper
end
