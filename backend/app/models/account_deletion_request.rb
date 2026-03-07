# frozen_string_literal: true

class AccountDeletionRequest < ApplicationRecord
  belongs_to :user, polymorphic: true, optional: true

  enum :status, { pending: "pending", completed: "completed", cancelled: "cancelled" }

  validates :user_type, presence: true
  validates :user_id, presence: true
  validates :grace_period_ends_at, presence: true

  before_validation :set_grace_period, on: :create

  scope :past_grace_period, -> { pending.where("grace_period_ends_at <= ?", Time.current) }

  def cancel!
    update!(status: :cancelled)
  end

  def complete!
    update!(status: :completed, completed_at: Time.current)
  end

  private

  def set_grace_period
    self.grace_period_ends_at ||= 30.days.from_now
  end
end
