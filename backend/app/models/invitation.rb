# frozen_string_literal: true

class Invitation < ApplicationRecord
  belongs_to :inviter, polymorphic: true
  belongs_to :school

  enum :status, { pending: "pending", accepted: "accepted", expired: "expired", revoked: "revoked" }

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: %w[teacher] }
  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true

  before_validation :generate_token, on: :create
  before_validation :set_expiry, on: :create

  scope :active, -> { pending.where("expires_at > ?", Time.current) }

  def expired?
    expires_at < Time.current
  end

  def accept!(user)
    update!(status: :accepted, accepted_at: Time.current)
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end

  def set_expiry
    self.expires_at ||= 7.days.from_now
  end
end
