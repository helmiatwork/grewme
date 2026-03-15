class BehaviorSummary < ApplicationRecord
  belongs_to :student
  belongs_to :classroom
  belongs_to :top_behavior_category, class_name: "BehaviorCategory", optional: true

  validates :week_start, presence: true
  validates :student_id, uniqueness: { scope: [ :classroom_id, :week_start ] }
  validates :total_points, presence: true
  validates :positive_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :negative_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
