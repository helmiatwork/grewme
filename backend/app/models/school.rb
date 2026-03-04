class School < ApplicationRecord
  has_many :classrooms, dependent: :destroy

  validates :name, presence: true
end
