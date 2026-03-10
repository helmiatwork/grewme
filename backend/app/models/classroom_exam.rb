class ClassroomExam < ApplicationRecord
  belongs_to :exam
  belongs_to :classroom
  belongs_to :assigned_by, polymorphic: true

  has_many :exam_submissions, dependent: :destroy
  has_many :student_questions, dependent: :destroy

  enum :status, { draft: 0, active: 1, closed: 2 }

  before_create :generate_access_code

  validates :exam_id, uniqueness: { scope: :classroom_id }
  validates :access_code, uniqueness: true, allow_nil: true
  validates :duration_minutes, numericality: { greater_than: 0 }, allow_nil: true

  private

  def generate_access_code
    loop do
      self.access_code = AccessCodeGenerator.generate
      break unless ClassroomExam.exists?(access_code: access_code)
    end
  end

  scope :upcoming, -> { where("scheduled_at > ?", Time.current) }
  scope :active_exams, -> { active.where("due_at IS NULL OR due_at > ?", Time.current) }
end
