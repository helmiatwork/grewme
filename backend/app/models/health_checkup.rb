class HealthCheckup < ApplicationRecord
  belongs_to :student
  belongs_to :teacher

  encrypts :notes

  validates :measured_at, presence: true
  validates :weight_kg, numericality: { greater_than: 0 }, allow_nil: true
  validates :height_cm, numericality: { greater_than: 0 }, allow_nil: true
  validates :head_circumference_cm, numericality: { greater_than: 0 }, allow_nil: true
  validates :student_id, uniqueness: { scope: :measured_at, message: "already has a checkup on this date" }

  validate :at_least_one_measurement

  before_save :calculate_bmi

  private

  def calculate_bmi
    if weight_kg.present? && height_cm.present? && height_cm > 0
      height_m = height_cm / BigDecimal(100)
      self.bmi = (weight_kg / (height_m**2)).round(1)
    else
      self.bmi = nil
    end
  end

  def at_least_one_measurement
    if weight_kg.blank? && height_cm.blank? && head_circumference_cm.blank?
      errors.add(:base, "At least one measurement (weight, height, or head circumference) is required")
    end
  end
end
