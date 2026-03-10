class ClassroomExam < ApplicationRecord
  belongs_to :exam
  belongs_to :classroom
  belongs_to :assigned_by, polymorphic: true

  has_many :exam_submissions, dependent: :destroy
  has_many :student_questions, dependent: :destroy

  enum :status, { draft: 0, active: 1, closed: 2 }

  validates :exam_id, uniqueness: { scope: :classroom_id }

  scope :upcoming, -> { where("scheduled_at > ?", Time.current) }
  scope :active_exams, -> { active.where("due_at IS NULL OR due_at > ?", Time.current) }
end
