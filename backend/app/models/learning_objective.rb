class LearningObjective < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :topic

  validates :name, presence: true, uniqueness: { scope: :topic_id }
  validates :exam_pass_threshold, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :daily_score_threshold, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

  default_scope { order(:position) }

  def subject
    topic.subject
  end
end
