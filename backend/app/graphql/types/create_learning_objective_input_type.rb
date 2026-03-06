# frozen_string_literal: true

module Types
  class CreateLearningObjectiveInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :description, String, required: false
    argument :topic_id, ID, required: true
    argument :exam_pass_threshold, Integer, required: false
    argument :daily_score_threshold, Integer, required: false
    argument :position, Integer, required: false
  end
end
