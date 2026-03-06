class ObjectiveMastery < ApplicationRecord
  belongs_to :student
  belongs_to :learning_objective

  validates :student_id, uniqueness: { scope: :learning_objective_id }

  scope :mastered, -> { where(exam_mastered: true, daily_mastered: true) }
  scope :for_student, ->(student_id) { where(student_id: student_id) }

  def mastered?
    exam_mastered? && daily_mastered?
  end
end
