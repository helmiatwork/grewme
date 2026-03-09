# frozen_string_literal: true

module Types
  class LeaveRequestType < Types::BaseObject
    field :id, ID, null: false
    field :request_type, LeaveRequestTypeEnum, null: false
    field :start_date, GraphQL::Types::ISO8601Date, null: false
    field :end_date, GraphQL::Types::ISO8601Date, null: false
    field :reason, String, null: false
    field :status, LeaveRequestStatusEnum, null: false
    field :rejection_reason, String
    field :reviewed_at, GraphQL::Types::ISO8601DateTime
    field :student, Types::StudentType, null: false
    field :parent, Types::ParentType, null: false
    field :reviewed_by, Types::TeacherType
    field :days_count, Integer, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
