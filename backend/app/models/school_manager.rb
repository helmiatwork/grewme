class SchoolManager < ApplicationRecord
  include PublicActivity::Model

  tracked

  devise :database_authenticatable, :recoverable, :rememberable, :validatable

  include Permissionable

  belongs_to :school
  has_many :refresh_tokens, as: :authenticatable, dependent: :destroy
  has_many :permissions, as: :permissionable, dependent: :destroy
  has_many :classroom_events, as: :creator, dependent: :nullify
  has_one_attached :avatar_image

  validates :name, presence: true

  def role
    "school_manager"
  end

  def school_manager?
    true
  end

  def teacher?
    false
  end

  def parent?
    false
  end

  def admin?
    false
  end

  def jwt_payload
    { "sub" => id, "type" => "SchoolManager" }
  end

  # Convenience: all classrooms in the school
  def school_classrooms
    school.classrooms
  end

  # Convenience: all classroom IDs in the school
  def school_classroom_ids
    school.classrooms.pluck(:id)
  end
end
