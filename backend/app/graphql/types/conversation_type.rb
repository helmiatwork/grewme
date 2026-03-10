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
      # Use preloaded messages to avoid N+1 COUNT query
      user = context[:current_user]
      object.messages.select { |m| m.sender_type != user.class.name || m.sender_id != user.id }
        .count { |m| m.read_at.nil? }
    end

    def messages
      # Sort preloaded messages in Ruby to avoid re-querying
      object.messages.sort_by(&:created_at)
    end

    def last_message
      # Use preloaded messages to avoid N+1 query
      object.messages.max_by(&:created_at)
    end
  end
end
