class Teacher < ApplicationRecord
  devise :database_authenticatable, :registerable, :recoverable, :validatable

  include Permissionable

  belongs_to :school, optional: true

  has_many :classrooms, foreign_key: :teacher_id, dependent: :destroy, inverse_of: :teacher
  has_many :daily_scores, foreign_key: :teacher_id, dependent: :destroy, inverse_of: :teacher
  has_many :refresh_tokens, as: :authenticatable, dependent: :destroy
  has_many :permissions, as: :permissionable, dependent: :destroy

  validates :name, presence: true

  def role
    "teacher"
  end

  def teacher?
    true
  end

  def parent?
    false
  end

  def admin?
    false
  end

  def jwt_payload
    { "sub" => id, "type" => "Teacher" }
  end
end
