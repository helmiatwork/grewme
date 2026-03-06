class Topic < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :subject
  has_many :learning_objectives, dependent: :destroy
  # has_many :exams, dependent: :destroy  # uncomment when Exam model exists

  validates :name, presence: true, uniqueness: { scope: :subject_id }

  default_scope { order(:position) }
end
