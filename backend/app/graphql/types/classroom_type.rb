# frozen_string_literal: true

module Types
  class ClassroomType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :school, Types::SchoolType, null: false
    field :student_count, Integer, null: false
    field :students, [ Types::StudentType ], null: false

    def student_count
      object.classroom_students.select(&:active?).size
    end

    def students
      object.students
    end
  end
end
