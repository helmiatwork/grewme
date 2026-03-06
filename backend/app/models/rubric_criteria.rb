class RubricCriteria < ApplicationRecord
  belongs_to :exam

  validates :name, presence: true
  validates :max_score, numericality: { only_integer: true, greater_than: 0 }

  default_scope { order(:position) }
end
