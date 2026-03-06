# frozen_string_literal: true

module Types
  class ExamObjectType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: false
    field :description, String
    field :exam_type, Types::ExamTypeEnum, null: false
    field :max_score, Integer
    field :duration_minutes, Integer
    field :topic, Types::TopicType, null: false
    field :exam_questions, [ Types::ExamQuestionType ], null: false
    field :rubric_criteria, [ Types::RubricCriteriaType ], null: false
    field :classroom_exams, [ Types::ClassroomExamType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
