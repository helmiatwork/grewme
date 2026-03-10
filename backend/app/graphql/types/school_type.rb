# frozen_string_literal: true

module Types
  class SchoolType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :min_grade, Integer, null: false
    field :max_grade, Integer, null: false
    field :phone, String
    field :email, String
    field :website, String
    field :address_line1, String
    field :city, String
    field :state_province, String
    field :postal_code, String
    field :country_code, String
    field :onboarding_completed_at, GraphQL::Types::ISO8601DateTime
    field :onboarding_step, Integer, null: false
    field :academic_years, [ Types::AcademicYearType ], null: false
  end
end
