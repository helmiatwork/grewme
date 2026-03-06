class ExamQuestion < ApplicationRecord
  belongs_to :exam

  validates :question_text, presence: true
  validates :correct_answer, presence: true
  validates :points, numericality: { only_integer: true, greater_than: 0 }

  default_scope { order(:position) }
end
