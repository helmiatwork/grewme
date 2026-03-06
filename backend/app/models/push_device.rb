# frozen_string_literal: true

class PushDevice < ApplicationRecord
  belongs_to :user, polymorphic: true

  PLATFORMS = %w[android ios web].freeze

  validates :token, presence: true, uniqueness: true
  validates :platform, presence: true, inclusion: { in: PLATFORMS }

  scope :active, -> { where(active: true) }
  scope :for_platform, ->(platform) { where(platform: platform) }

  def touch_last_seen!
    update_column(:last_seen_at, Time.current)
  end

  def deactivate!
    update!(active: false)
  end
end
