class GradeCurriculumItem < ApplicationRecord
  belongs_to :grade_curriculum
  belongs_to :subject, optional: true
  belongs_to :topic, optional: true

  validates :position, presence: true
  validate :exactly_one_reference

  default_scope { order(:position) }

  def display_name
    if subject
      "#{subject.name} (all topics)"
    elsif topic
      topic.name
    end
  end

  private

  def exactly_one_reference
    if subject_id.blank? && topic_id.blank?
      errors.add(:base, "Must reference either a subject or a topic")
    elsif subject_id.present? && topic_id.present?
      errors.add(:base, "Cannot reference both a subject and a topic")
    end
  end
end
