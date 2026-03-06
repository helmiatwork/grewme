# frozen_string_literal: true

module Types
  class PushDeviceType < Types::BaseObject
    field :id, ID, null: false
    field :platform, String, null: false
    field :active, Boolean, null: false
    field :last_seen_at, GraphQL::Types::ISO8601DateTime
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
