# frozen_string_literal: true

require "test_helper"

class MeQueryTest < ActiveSupport::TestCase
  ME_QUERY = <<~GRAPHQL
    query {
      me {
        ... on Teacher { id name email role }
        ... on Parent { id name email role }
      }
    }
  GRAPHQL

  test "returns current teacher" do
    teacher = teachers(:teacher_alice)
    result = execute_query(query: ME_QUERY, user: teacher)

    assert_nil gql_errors(result)
    data = gql_data(result)["me"]
    assert_equal teacher.name, data["name"]
    assert_equal "teacher", data["role"]
  end

  test "returns current parent" do
    parent = parents(:parent_carol)
    result = execute_query(query: ME_QUERY, user: parent)

    assert_nil gql_errors(result)
    data = gql_data(result)["me"]
    assert_equal parent.name, data["name"]
    assert_equal "parent", data["role"]
  end

  test "errors when unauthenticated" do
    result = execute_query(query: ME_QUERY)
    assert_not_nil gql_errors(result)
    assert_match "Authentication required", gql_errors(result).first["message"]
  end
end
