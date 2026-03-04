class RefreshToken < ApplicationRecord
  belongs_to :authenticatable, polymorphic: true

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  attr_accessor :raw_token

  before_create :generate_token

  def revoke!
    update!(revoked_at: Time.current)
  end

  def expired?
    expires_at < Time.current
  end

  def revoked?
    revoked_at.present?
  end

  def active?
    !revoked? && !expired?
  end

  private

  def generate_token
    self.raw_token = SecureRandom.urlsafe_base64(32)
    self.token_digest = Digest::SHA256.hexdigest(raw_token)
    self.expires_at ||= 7.days.from_now
  end
end
