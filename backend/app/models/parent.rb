class Parent < ApplicationRecord
  include PublicActivity::Model

  tracked

  devise :database_authenticatable, :registerable, :recoverable, :validatable

  include Permissionable

  has_many :parent_students, foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent
  has_many :children, through: :parent_students, source: :student
  has_many :refresh_tokens, as: :authenticatable, dependent: :destroy
  has_many :permissions, as: :permissionable, dependent: :destroy
  has_many :classroom_events, as: :creator, dependent: :destroy
  has_many :notifications, as: :recipient, dependent: :destroy
  has_many :push_devices, as: :user, dependent: :destroy
  has_many :conversations, dependent: :destroy

  has_one_attached :avatar_image

  encrypts :name
  encrypts :email, deterministic: true

  validates :name, presence: true

  def role
    "parent"
  end

  def teacher?
    false
  end

  def parent?
    true
  end

  def admin?
    false
  end

  def school_manager?
    false
  end

  def jwt_payload
    { "sub" => id, "type" => "Parent" }
  end
end
