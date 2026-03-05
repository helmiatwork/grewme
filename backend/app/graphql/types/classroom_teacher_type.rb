# frozen_string_literal: true

module Types
  class ClassroomTeacherType < Types::BaseObject
    field :id, ID, null: false
    field :teacher, Types::TeacherType, null: false
    field :classroom, Types::ClassroomType, null: false
    field :role, String, null: false
  end
end
