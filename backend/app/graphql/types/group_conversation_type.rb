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
      object.group_messages.chronological
    end

    def last_message
      object.last_message
    end
  end
end
