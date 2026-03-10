class QuestionTemplate < ApplicationRecord
  validates :name, presence: true
  validates :category, presence: true
  validates :template_text, presence: true
  validates :formula, presence: true
  validates :grade_min, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :grade_max, numericality: { only_integer: true, less_than_or_equal_to: 12 }

  scope :by_category, ->(cat) { where(category: cat) }
  scope :for_grade, ->(grade) { where("grade_min <= ? AND grade_max >= ?", grade, grade) }
end
