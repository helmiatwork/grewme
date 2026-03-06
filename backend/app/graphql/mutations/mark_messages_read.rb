# frozen_string_literal: true

module Mutations
  class MarkMessagesRead < BaseMutation
    argument :conversation_id, ID, required: true

    field :success, Boolean, null: false

    def resolve(conversation_id:)
      authenticate!

      conversation = Conversation.find(conversation_id)
      raise Pundit::NotAuthorizedError unless ConversationPolicy.new(current_user, conversation).show?

      conversation.messages
        .where.not(sender_type: current_user.class.name, sender_id: current_user.id)
        .where(read_at: nil)
        .update_all(read_at: Time.current)

      { success: true }
    end
  end
end
