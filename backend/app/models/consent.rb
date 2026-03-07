# frozen_string_literal: true

class Consent < ApplicationRecord
  belongs_to :student
  belongs_to :parent, optional: true

  enum :status, {
    pending: "pending",
    granted: "granted",
    declined: "declined",
    revoked: "revoked",
    expired: "expired"
  }

  encrypts :parent_email, deterministic: true
  encrypts :ip_address

  validates :parent_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :token, presence: true, uniqueness: true
  validates :consent_method, presence: true, inclusion: { in: %w[email_plus school_official] }

  before_validation :generate_token, on: :create
  before_validation :set_expiry, on: :create

  scope :active, -> { granted.where(revoked_at: nil) }
  scope :pending_expired, -> { pending.where("expires_at < ?", Time.current) }

  def grant!(parent:, ip_address: nil)
    update!(
      status: :granted,
      parent: parent,
      granted_at: Time.current,
      ip_address: ip_address
    )
  end

  def revoke!
    update!(status: :revoked, revoked_at: Time.current)
  end

  def decline!
    update!(status: :declined)
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end

  def set_expiry
    self.expires_at ||= 60.days.from_now
  end
end
