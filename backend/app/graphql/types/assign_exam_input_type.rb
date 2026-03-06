# frozen_string_literal: true

module Types
  class AssignExamInputType < Types::BaseInputObject
    argument :exam_id, ID, required: true
    argument :classroom_id, ID, required: true
    argument :scheduled_at, GraphQL::Types::ISO8601DateTime, required: false
    argument :due_at, GraphQL::Types::ISO8601DateTime, required: false
  end
end
