# frozen_string_literal: true

module Types
  class UpdateAcademicYearInputType < Types::BaseInputObject
    argument :id, ID, required: true
    argument :label, String, required: false
    argument :start_date, GraphQL::Types::ISO8601Date, required: false
    argument :end_date, GraphQL::Types::ISO8601Date, required: false
  end
end
