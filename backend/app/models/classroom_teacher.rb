class ClassroomTeacher < ApplicationRecord
  include PublicActivity::Model
  tracked

  belongs_to :classroom
  belongs_to :teacher

  ROLES = %w[primary assistant substitute].freeze

  validates :role, presence: true, inclusion: { in: ROLES }
  validates :teacher_id, uniqueness: { scope: :classroom_id, message: "is already assigned to this classroom" }

  scope :primary, -> { where(role: "primary") }
  scope :assistants, -> { where(role: "assistant") }
end
