# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :sender, polymorphic: true

  validates :body, presence: true

  scope :chronological, -> { order(created_at: :asc) }

  after_create_commit :broadcast_to_conversation

  def sender_name
    sender.name
  end

  def mine?(user)
    sender_type == user.class.name && sender_id == user.id
  end

  private

  def broadcast_to_conversation
    ChatChannel.broadcast_to(
      conversation,
      {
        type: "new_message",
        message: {
          id: id,
          body: body,
          senderName: sender.name,
          senderType: sender_type,
          senderId: sender_id,
          mine: false,
          createdAt: created_at.iso8601
        }
      }
    )
  end
end
