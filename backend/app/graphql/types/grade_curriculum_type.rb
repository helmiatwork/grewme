# frozen_string_literal: true

module Types
  class GradeCurriculumType < Types::BaseObject
    field :id, ID, null: false
    field :grade, Integer, null: false
    field :academic_year, Types::AcademicYearType, null: false
    field :grade_curriculum_items, [ Types::GradeCurriculumItemType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
