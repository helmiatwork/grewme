# frozen_string_literal: true

module Types
  class NotificationType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: false
    field :body, String, null: false
    field :kind, String, null: true
    field :params, GraphQL::Types::JSON, null: true
    field :notifiable_type, String, null: false
    field :notifiable_id, ID, null: false
    field :read, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def read
      object.read?
    end
  end
end
