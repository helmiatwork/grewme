class BehaviorPoint < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :student
  belongs_to :teacher
  belongs_to :classroom
  belongs_to :behavior_category

  validates :point_value, presence: true, numericality: { only_integer: true, in: -5..5, other_than: 0 }
  validates :awarded_at, presence: true

  scope :active, -> { where(revoked_at: nil) }
  scope :positive, -> { where("point_value > 0") }
  scope :negative, -> { where("point_value < 0") }
  scope :for_date, ->(date) { where(awarded_at: date.beginning_of_day..date.end_of_day) }
  scope :for_week, ->(date) { where(awarded_at: date.beginning_of_week..date.end_of_week) }

  def revokable?
    revoked_at.nil? && awarded_at > 15.minutes.ago
  end

  def revoke!
    raise "Cannot revoke: outside 15-minute window" unless revokable?
    update!(revoked_at: Time.current)
  end

  def revoked?
    revoked_at.present?
  end
end
