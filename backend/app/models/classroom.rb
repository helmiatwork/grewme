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

  validates :name, presence: true

  def primary_teacher
    classroom_teachers.primary.first&.teacher
  end

  def teacher_ids
    classroom_teachers.pluck(:teacher_id)
  end
end
