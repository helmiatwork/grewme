# frozen_string_literal: true

require "ostruct"

module GraphqlTestHelper
  def execute_query(query: nil, mutation: nil, variables: {}, user: nil)
    GrewmeSchema.execute(
      query || mutation,
      variables: variables.deep_stringify_keys,
      context: {
        current_user: user,
        request: OpenStruct.new(
          remote_ip: "127.0.0.1",
          user_agent: "test",
          headers: { "Authorization" => "" }
        )
      }
    )
  end

  def gql_data(result)
    result["data"]
  end

  def gql_errors(result)
    result["errors"]
  end
end
