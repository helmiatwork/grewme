# frozen_string_literal: true

module Types
  class AttendanceType < Types::BaseObject
    field :id, ID, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :status, AttendanceStatusEnum, null: false
    field :notes, String
    field :student, Types::StudentType, null: false
    field :classroom, Types::ClassroomType, null: false
    field :leave_request, Types::LeaveRequestType
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
