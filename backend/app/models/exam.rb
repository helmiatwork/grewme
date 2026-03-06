class Exam < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :topic
  belongs_to :created_by, polymorphic: true

  has_many :exam_questions, dependent: :destroy
  has_many :rubric_criteria, class_name: "RubricCriteria", dependent: :destroy
  has_many :classroom_exams, dependent: :destroy

  enum :exam_type, { score_based: 0, multiple_choice: 1, rubric: 2, pass_fail: 3 }

  validates :title, presence: true
  validates :exam_type, presence: true
  validates :max_score, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :duration_minutes, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

  def subject
    topic.subject
  end
end
