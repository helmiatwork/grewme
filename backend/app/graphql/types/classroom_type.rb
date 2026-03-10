# frozen_string_literal: true

module Types
  class ClassroomType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :school, Types::SchoolType, null: false
    field :grade, Integer
    field :student_count, Integer, null: false
    field :students, [ Types::StudentType ], null: false

    def student_count
      object.classroom_students.select(&:active?).size
    end

    def students
      # Use preloaded classroom_students to avoid N+1, filter active in Ruby
      object.classroom_students.select(&:active?).map(&:student)
    end
  end
end
