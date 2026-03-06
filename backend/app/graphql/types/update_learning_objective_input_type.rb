# frozen_string_literal: true

module Types
  class UpdateLearningObjectiveInputType < Types::BaseInputObject
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :description, String, required: false
    argument :exam_pass_threshold, Integer, required: false
    argument :daily_score_threshold, Integer, required: false
    argument :position, Integer, required: false
  end
end
