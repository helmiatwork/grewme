class ExamAnswer < ApplicationRecord
  belongs_to :exam_submission
  belongs_to :exam_question
  belongs_to :student_question, optional: true

  validates :exam_question_id, uniqueness: { scope: :exam_submission_id }
end
