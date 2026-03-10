class ExamSubmission < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :student
  belongs_to :classroom_exam

  has_many :exam_answers, dependent: :destroy
  has_many :rubric_scores, dependent: :destroy

  enum :status, { not_started: 0, in_progress: 1, submitted: 2, graded: 3 }

  before_create :generate_session_token

  validates :student_id, uniqueness: { scope: :classroom_exam_id }
  validates :session_token, uniqueness: true, allow_nil: true

  scope :graded, -> { where(status: :graded) }
  scope :for_student, ->(student_id) { where(student_id: student_id) }

  def exam
    classroom_exam.exam
  end

  def passed?
    !!passed
  end

  def time_remaining
    return nil unless classroom_exam.duration_minutes && started_at
    deadline = started_at + classroom_exam.duration_minutes.minutes
    remaining = (deadline - Time.current).to_i
    [ remaining, 0 ].max
  end

  def time_expired?
    return false unless classroom_exam.duration_minutes && started_at
    time_remaining == 0
  end

  private

  def generate_session_token
    self.session_token ||= SecureRandom.urlsafe_base64(32)
  end
end
