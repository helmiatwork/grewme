class ExamQuestion < ApplicationRecord
  belongs_to :exam

  has_many :student_questions, dependent: :destroy

  enum :value_mode, { fixed: 0, shuffled: 1 }

  validates :question_text, presence: true, unless: :parameterized?
  validates :correct_answer, presence: true, unless: :parameterized?
  validates :template_text, presence: true, if: :parameterized?
  validates :formula, presence: true, if: :parameterized?
  validates :points, numericality: { only_integer: true, greater_than: 0 }

  default_scope { order(:position) }
end
