class Parent < ApplicationRecord
  include PublicActivity::Model
  tracked

  devise :database_authenticatable, :registerable, :recoverable, :validatable

  include Permissionable

  has_many :parent_students, foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent
  has_many :children, through: :parent_students, source: :student
  has_many :refresh_tokens, as: :authenticatable, dependent: :destroy
  has_many :permissions, as: :permissionable, dependent: :destroy

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

  def jwt_payload
    { "sub" => id, "type" => "Parent" }
  end
end
