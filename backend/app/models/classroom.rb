class Classroom < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :school

  has_many :classroom_teachers, dependent: :destroy
  has_many :teachers, through: :classroom_teachers
  has_many :classroom_students, dependent: :destroy
  has_many :students, -> { merge(ClassroomStudent.current) }, through: :classroom_students
  has_many :feed_posts, dependent: :destroy
  has_many :classroom_events, dependent: :destroy
  has_many :classroom_exams, dependent: :destroy
  has_many :exams, through: :classroom_exams

  validates :name, presence: true
  validates :grade, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 12 }, allow_nil: true

  def primary_teacher
    classroom_teachers.primary.first&.teacher
  end

  def teacher_ids
    classroom_teachers.pluck(:teacher_id)
  end
end
