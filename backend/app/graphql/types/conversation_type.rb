# frozen_string_literal: true

module Types
  class ConversationType < Types::BaseObject
    field :id, ID, null: false
    field :student, Types::StudentType, null: false
    field :parent, Types::ParentType, null: false
    field :teacher, Types::TeacherType, null: false
    field :last_message, Types::MessageType, null: true
    field :unread_count, Integer, null: false
    field :messages, [ Types::MessageType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def unread_count
      object.unread_count_for(context[:current_user])
    end

    def messages
      object.messages.chronological
    end

    def last_message
      object.last_message
    end
  end
end
