# frozen_string_literal: true

module Mutations
  class BaseMutation < GraphQL::Schema::Mutation
    argument_class Types::BaseArgument
    field_class Types::BaseField

    def current_user
      context[:current_user]
    end

    def authenticate!
      raise GraphQL::ExecutionError, "Authentication required" unless current_user
    end

    def authorize!(record, action)
      policy_class = "#{record.class}Policy".constantize
      policy = policy_class.new(current_user, record)
      raise Pundit::NotAuthorizedError unless policy.public_send(action)
    end
  end
end
