# frozen_string_literal: true

class GraphqlController < ApplicationController
  # Skip default auth — we handle it per-query/mutation in GraphQL context
  skip_before_action :authenticate_user!

  def execute
    variables = prepare_variables(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]

    # Try to authenticate (don't fail if no token — some mutations are public)
    token = extract_token
    user = nil
    if token.present?
      payload = decode_jwt(token)
      user = find_authenticatable(payload) if payload
    end

    context = {
      current_user: user,
      request: request
    }

    result = GrewmeSchema.execute(query, variables: variables, context: context, operation_name: operation_name)
    render json: result
  rescue => e
    raise e unless Rails.env.development?
    handle_error_in_development(e)
  end

  private

  def prepare_variables(variables_param)
    case variables_param
    when String
      if variables_param.present?
        JSON.parse(variables_param) || {}
      else
        {}
      end
    when Hash
      variables_param
    when ActionController::Parameters
      variables_param.to_unsafe_hash
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{variables_param}"
    end
  end

  def handle_error_in_development(e)
    logger.error e.message
    logger.error e.backtrace.join("\n")

    render json: { errors: [ { message: e.message, backtrace: e.backtrace.first(5) } ], data: {} }, status: :internal_server_error
  end
end
