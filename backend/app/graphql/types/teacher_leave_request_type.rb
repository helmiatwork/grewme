# frozen_string_literal: true

module Types
  class TeacherLeaveRequestType < Types::BaseObject
    field :id, ID, null: false
    field :request_type, String, null: false
    field :status, String, null: false
    field :start_date, GraphQL::Types::ISO8601Date, null: false
    field :end_date, GraphQL::Types::ISO8601Date, null: false
    field :reason, String, null: false
    field :rejection_reason, String
    field :reviewed_at, GraphQL::Types::ISO8601DateTime
    field :days_count, Float, null: false
    field :half_day_session, String
    field :teacher, Types::TeacherType, null: false
    field :school, Types::SchoolType, null: false
    field :reviewed_by, Types::SchoolManagerType
    field :substitute, Types::TeacherType
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
