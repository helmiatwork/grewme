class ExamSubmission < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :student
  belongs_to :classroom_exam

  has_many :exam_answers, dependent: :destroy
  has_many :rubric_scores, dependent: :destroy

  enum :status, { not_started: 0, in_progress: 1, submitted: 2, graded: 3 }

  validates :student_id, uniqueness: { scope: :classroom_exam_id }

  scope :graded, -> { where(status: :graded) }
  scope :for_student, ->(student_id) { where(student_id: student_id) }

  def exam
    classroom_exam.exam
  end

  def passed?
    !!passed
  end
end
