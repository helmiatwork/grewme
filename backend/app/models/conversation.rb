# frozen_string_literal: true

class Conversation < ApplicationRecord
  belongs_to :student
  belongs_to :parent
  belongs_to :teacher

  has_many :messages, dependent: :destroy

  validates :student_id, uniqueness: { scope: [ :parent_id, :teacher_id ] }

  scope :for_user, ->(user) {
    if user.teacher?
      where(teacher_id: user.id)
    elsif user.parent?
      where(parent_id: user.id)
    else
      none
    end
  }

  def other_participant(user)
    user.teacher? ? parent : teacher
  end

  def last_message
    messages.order(created_at: :desc).first
  end

  def unread_count_for(user)
    messages.where.not(sender_type: user.class.name, sender_id: user.id)
      .where(read_at: nil)
      .count
  end
end
