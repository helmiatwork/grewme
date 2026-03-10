# frozen_string_literal: true

module Types
  class ClassroomExamType < Types::BaseObject
    field :id, ID, null: false
    field :exam, Types::ExamObjectType, null: false
    field :classroom, Types::ClassroomType, null: false
    field :status, Types::ClassroomExamStatusEnum, null: false
    field :scheduled_at, GraphQL::Types::ISO8601DateTime
    field :due_at, GraphQL::Types::ISO8601DateTime
    field :exam_submissions, [ Types::ExamSubmissionType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    field :access_code, String
    field :duration_minutes, Integer
    field :show_results, Boolean, null: false
  end
end
