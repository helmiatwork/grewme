class Classroom < ApplicationRecord
  belongs_to :school
  belongs_to :teacher

  has_many :classroom_students, dependent: :destroy
  has_many :students, -> { merge(ClassroomStudent.current) }, through: :classroom_students

  validates :name, presence: true
end
