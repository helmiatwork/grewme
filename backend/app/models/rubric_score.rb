class RubricScore < ApplicationRecord
  belongs_to :exam_submission
  belongs_to :rubric_criteria

  validates :score, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :rubric_criteria_id, uniqueness: { scope: :exam_submission_id }
end
