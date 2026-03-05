# frozen_string_literal: true

module Types
  class DailyScoreType < Types::BaseObject
    field :id, ID, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :skill_category, Types::SkillCategoryEnum, null: false
    field :score, Integer, null: false
    field :notes, String
    field :student_id, ID, null: false
    field :student, Types::StudentType, null: false
    field :teacher, Types::TeacherType, null: false
  end
end
