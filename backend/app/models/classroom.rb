class Classroom < ApplicationRecord
  belongs_to :school
  belongs_to :teacher, class_name: "User"

  has_many :students, dependent: :destroy

  validates :name, presence: true
end
