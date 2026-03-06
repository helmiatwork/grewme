# frozen_string_literal: true

class GroupConversation < ApplicationRecord
  belongs_to :classroom

  has_many :group_messages, dependent: :destroy

  validates :classroom_id, uniqueness: true

  def last_message
    group_messages.order(created_at: :desc).first
  end

  def name
    classroom.name
  end
end
