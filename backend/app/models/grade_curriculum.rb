class GradeCurriculum < ApplicationRecord
  belongs_to :academic_year
  has_many :grade_curriculum_items, dependent: :destroy

  validates :grade, presence: true,
    numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 12 },
    uniqueness: { scope: :academic_year_id }

  delegate :school, to: :academic_year
end
