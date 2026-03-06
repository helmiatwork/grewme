class AcademicYear < ApplicationRecord
  belongs_to :school
  has_many :grade_curriculums, dependent: :destroy

  validates :label, presence: true, uniqueness: { scope: :school_id }
  validates :start_date, :end_date, presence: true
  validate :end_date_after_start_date

  scope :current_year, -> { where(current: true) }

  def set_as_current!
    transaction do
      school.academic_years.where(current: true).update_all(current: false)
      update!(current: true)
    end
  end

  after_commit :invalidate_academic_year_cache

  private

  def end_date_after_start_date
    errors.add(:end_date, "must be after start date") if end_date && start_date && end_date <= start_date
  end

  def invalidate_academic_year_cache
    Rails.cache.delete("academic_years/#{school_id}")
  end
end
