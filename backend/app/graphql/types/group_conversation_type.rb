# frozen_string_literal: true

module Types
  class GroupConversationType < Types::BaseObject
    field :id, ID, null: false
    field :classroom, Types::ClassroomType, null: false
    field :name, String, null: false
    field :last_message, Types::GroupMessageType, null: true
    field :messages, [ Types::GroupMessageType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def messages
      # Sort preloaded group_messages in Ruby to avoid re-querying
      object.group_messages.sort_by(&:created_at)
    end

    def last_message
      # Use preloaded group_messages to avoid N+1 query
      object.group_messages.max_by(&:created_at)
    end
  end
end
