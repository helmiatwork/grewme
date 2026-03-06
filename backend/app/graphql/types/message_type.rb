# frozen_string_literal: true

module Types
  class MessageType < Types::BaseObject
    field :id, ID, null: false
    field :body, String, null: false
    field :sender_name, String, null: false
    field :sender_type, String, null: false
    field :sender_id, ID, null: false
    field :mine, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def mine
      context[:current_user] && object.mine?(context[:current_user])
    end
  end
end
