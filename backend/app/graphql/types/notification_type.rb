# frozen_string_literal: true

module Types
  class NotificationType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: false
    field :body, String, null: false
    field :feed_post, Types::FeedPostType, null: false
    field :read, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def read
      object.read?
    end
  end
end
