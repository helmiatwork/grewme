# frozen_string_literal: true

module Types
  class SchoolOverviewType < Types::BaseObject
    field :school_name, String, null: false
    field :classroom_count, Integer, null: false
    field :student_count, Integer, null: false
    field :teacher_count, Integer, null: false
  end
end
