# frozen_string_literal: true

module Types
  class ObjectiveMasteryType < Types::BaseObject
    field :id, ID, null: false
    field :student, Types::StudentType, null: false
    field :learning_objective, Types::LearningObjectiveType, null: false
    field :exam_mastered, Boolean, null: false
    field :daily_mastered, Boolean, null: false
    field :mastered, Boolean, null: false
    field :mastered_at, GraphQL::Types::ISO8601DateTime

    def mastered
      object.mastered?
    end
  end
end
