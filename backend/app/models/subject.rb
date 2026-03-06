class Subject < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :school
  has_many :topics, dependent: :destroy

  validates :name, presence: true, uniqueness: { scope: :school_id }
end
