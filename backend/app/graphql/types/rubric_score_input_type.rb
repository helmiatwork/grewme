# frozen_string_literal: true

module Types
  class RubricScoreInputType < Types::BaseInputObject
    argument :rubric_criteria_id, ID, required: true
    argument :score, Integer, required: true
    argument :feedback, String, required: false
  end
end
