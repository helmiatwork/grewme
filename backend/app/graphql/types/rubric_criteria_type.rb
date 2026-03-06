# frozen_string_literal: true

module Types
  class RubricCriteriaType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String
    field :max_score, Integer, null: false
    field :position, Integer, null: false
  end
end
