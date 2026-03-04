class User < ApplicationRecord
  has_secure_password
  include Permissionable

  enum :role, { teacher: 0, parent: 1, admin: 2 }

  has_many :classrooms, foreign_key: :teacher_id, dependent: :destroy, inverse_of: :teacher
  has_many :parent_students, foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent
  has_many :children, through: :parent_students, source: :student
  has_many :daily_scores, foreign_key: :teacher_id, dependent: :destroy, inverse_of: :teacher
  has_many :refresh_tokens, dependent: :destroy
  has_many :permissions, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true
  validates :password, length: { minimum: 8 }, if: -> { new_record? || password.present? }
end
