# frozen_string_literal: true

module Types
  class FeedPostCommentType < Types::BaseObject
    field :id, ID, null: false
    field :body, String, null: false
    field :commenter_name, String, null: false
    field :commenter_type, String, null: false
    field :commenter_id, ID, null: false
    field :is_mine, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def commenter_name
      object.commenter.name
    end

    def is_mine
      return false unless context[:current_user]
      object.commenter == context[:current_user]
    end
  end
end
