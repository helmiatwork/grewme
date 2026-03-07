# frozen_string_literal: true

module Types
  class AccountDeletionRequestType < Types::BaseObject
    field :id, ID, null: false
    field :status, String, null: false
    field :grace_period_ends_at, GraphQL::Types::ISO8601DateTime, null: false
    field :completed_at, GraphQL::Types::ISO8601DateTime
    field :reason, String
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
