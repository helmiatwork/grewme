# frozen_string_literal: true

module Types
  class ExamSubmissionType < Types::BaseObject
    field :id, ID, null: false
    field :student, Types::StudentType, null: false
    field :classroom_exam, Types::ClassroomExamType, null: false
    field :status, Types::ExamSubmissionStatusEnum, null: false
    field :score, Float
    field :passed, Boolean
    field :started_at, GraphQL::Types::ISO8601DateTime
    field :submitted_at, GraphQL::Types::ISO8601DateTime
    field :graded_at, GraphQL::Types::ISO8601DateTime
    field :teacher_notes, String
    field :exam_answers, [ Types::ExamAnswerType ], null: false
    field :rubric_scores, [ Types::RubricScoreType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
