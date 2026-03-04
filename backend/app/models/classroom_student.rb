class ClassroomStudent < ApplicationRecord
  belongs_to :student
  belongs_to :classroom

  enum :status, { active: 0, inactive: 1 }

  validates :academic_year, presence: true
  validates :enrolled_at, presence: true

  scope :current, -> { where(status: :active) }
  scope :historical, -> { where(status: :inactive) }

  def deactivate!(left_at_date = Date.current)
    update!(status: :inactive, left_at: left_at_date)
  end
end
