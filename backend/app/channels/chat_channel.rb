# frozen_string_literal: true

class ChatChannel < ApplicationCable::Channel
  def subscribed
    conversation = Conversation.find(params[:conversation_id])

    unless conversation.parent_id == current_user.id || conversation.teacher_id == current_user.id
      reject
      return
    end

    stream_for conversation
  end

  def unsubscribed
    # Cleanup when channel is unsubscribed
  end
end
