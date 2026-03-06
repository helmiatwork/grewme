# frozen_string_literal: true

module Types
  class SchoolType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :min_grade, Integer, null: false
    field :max_grade, Integer, null: false
    field :academic_years, [ Types::AcademicYearType ], null: false
  end
end
