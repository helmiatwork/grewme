# frozen_string_literal: true

module Types
  class AcademicYearType < Types::BaseObject
    field :id, ID, null: false
    field :label, String, null: false
    field :start_date, GraphQL::Types::ISO8601Date, null: false
    field :end_date, GraphQL::Types::ISO8601Date, null: false
    field :current, Boolean, null: false
    field :grade_curriculums, [ Types::GradeCurriculumType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
