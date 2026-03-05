# frozen_string_literal: true

module Types
  class CreateDailyScoreInputType < Types::BaseInputObject
    argument :student_id, ID, required: true
    argument :date, GraphQL::Types::ISO8601Date, required: true
    argument :skill_category, Types::SkillCategoryEnum, required: true
    argument :score, Integer, required: true
    argument :notes, String, required: false
  end
end
