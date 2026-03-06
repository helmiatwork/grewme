# frozen_string_literal: true

module Types
  class RubricCriteriaInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :description, String, required: false
    argument :max_score, Integer, required: false
    argument :position, Integer, required: false
  end
end
