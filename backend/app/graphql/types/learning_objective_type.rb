# frozen_string_literal: true

module Types
  class LearningObjectiveType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String
    field :exam_pass_threshold, Integer, null: false
    field :daily_score_threshold, Integer, null: false
    field :position, Integer, null: false
    field :topic, Types::TopicType, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
