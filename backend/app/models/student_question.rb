class StudentQuestion < ApplicationRecord
  belongs_to :exam_question
  belongs_to :student
  belongs_to :classroom_exam

  validates :generated_text, presence: true
  validates :correct_answer, presence: true
  validates :exam_question_id, uniqueness: { scope: [ :student_id, :classroom_exam_id ] }
end
