# frozen_string_literal: true

module Types
  class HealthCheckupType < Types::BaseObject
    field :id, ID, null: false
    field :measured_at, GraphQL::Types::ISO8601Date, null: false
    field :weight_kg, Float
    field :height_cm, Float
    field :head_circumference_cm, Float
    field :bmi, Float
    field :bmi_category, String
    field :notes, String
    field :student, Types::StudentType, null: false
    field :teacher, Types::TeacherType, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def bmi_category
      return nil unless object.bmi

      case object.bmi
      when 0...16 then "severely_underweight"
      when 16...18.5 then "underweight"
      when 18.5...25 then "normal"
      when 25...30 then "overweight"
      else "obese"
      end
    end
  end
end
