# frozen_string_literal: true

module Types
  class TeacherType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :classrooms, [ Types::ClassroomType ], null: false

    def classrooms
      object.classrooms
    end
  end
end
