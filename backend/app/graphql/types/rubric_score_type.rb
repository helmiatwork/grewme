# frozen_string_literal: true

module Types
  class RubricScoreType < Types::BaseObject
    field :id, ID, null: false
    field :rubric_criteria, Types::RubricCriteriaType, null: false
    field :score, Integer, null: false
    field :feedback, String
  end
end
