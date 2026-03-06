class Teacher < ApplicationRecord
  include PublicActivity::Model

  tracked

  devise :database_authenticatable, :registerable, :recoverable, :validatable

  include Permissionable

  belongs_to :school, optional: true

  has_many :classroom_teachers, dependent: :destroy
  has_many :classrooms, through: :classroom_teachers
  has_many :daily_scores, foreign_key: :teacher_id, dependent: :destroy, inverse_of: :teacher
  has_many :refresh_tokens, as: :authenticatable, dependent: :destroy
  has_many :permissions, as: :permissionable, dependent: :destroy
  has_many :feed_posts, dependent: :destroy
  has_many :classroom_events, as: :creator, dependent: :destroy
  has_many :notifications, as: :recipient, dependent: :destroy
  has_many :push_devices, as: :user, dependent: :destroy
  has_many :conversations, dependent: :destroy

  has_one_attached :avatar_image

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

  def school_manager?
    false
  end

  def jwt_payload
    { "sub" => id, "type" => "Teacher" }
  end
end
