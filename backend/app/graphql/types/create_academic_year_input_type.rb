# frozen_string_literal: true

module Types
  class CreateAcademicYearInputType < Types::BaseInputObject
    argument :school_id, ID, required: true
    argument :label, String, required: true
    argument :start_date, GraphQL::Types::ISO8601Date, required: true
    argument :end_date, GraphQL::Types::ISO8601Date, required: true
    argument :current, Boolean, required: false
  end
end
