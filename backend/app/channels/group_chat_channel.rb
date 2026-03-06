# frozen_string_literal: true

class GroupChatChannel < ApplicationCable::Channel
  def subscribed
    group_conversation = GroupConversation.find(params[:group_conversation_id])
    classroom = group_conversation.classroom

    # Teachers in the classroom or parents with children in the classroom
    authorized = if current_user.teacher?
      classroom.classroom_teachers.exists?(teacher_id: current_user.id)
    elsif current_user.parent?
      current_user.children
        .joins(:classroom_students)
        .where(classroom_students: { classroom_id: classroom.id, status: :active })
        .exists?
    else
      false
    end

    if authorized
      stream_for group_conversation
    else
      reject
    end
  end

  def unsubscribed
    # Cleanup when channel is unsubscribed
  end
end
