# frozen_string_literal: true

module Types
  class TopicType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String
    field :position, Integer, null: false
    field :subject, Types::SubjectType, null: false
    field :learning_objectives, [ Types::LearningObjectiveType ], null: false
    field :exams, [ Types::ExamObjectType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
