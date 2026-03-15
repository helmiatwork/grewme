class BehaviorCategory < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :school
  has_many :behavior_points, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { scope: :school_id, conditions: -> { where(deleted_at: nil) } }
  validates :point_value, presence: true, numericality: { only_integer: true, in: -5..5, other_than: 0 }
  validates :is_positive, inclusion: { in: [ true, false ] }
  validates :icon, presence: true
  validates :color, presence: true, format: { with: /\A#[0-9a-fA-F]{6}\z/, message: "must be a valid hex color" }

  scope :active, -> { where(deleted_at: nil) }
  scope :positive, -> { where(is_positive: true) }
  scope :negative, -> { where(is_positive: false) }
  scope :ordered, -> { order(:position) }

  before_validation :set_is_positive, if: :point_value_changed?

  def soft_delete!
    update!(deleted_at: Time.current)
  end

  def deleted?
    deleted_at.present?
  end

  private

  def set_is_positive
    self.is_positive = point_value.to_i > 0 if point_value.present?
  end
end
