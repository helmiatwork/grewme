# frozen_string_literal: true

module Mutations
  class AssignTeacherToClassroom < BaseMutation
    argument :teacher_id, ID, required: true
    argument :classroom_id, ID, required: true
    argument :role, String, required: true, description: "primary, assistant, or substitute"

    field :classroom_teacher, Types::ClassroomTeacherType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(teacher_id:, classroom_id:, role:)
      authenticate!
      raise GraphQL::ExecutionError, "Only school managers can do this" unless current_user.school_manager?

      teacher = Teacher.find(teacher_id)
      classroom = Classroom.find(classroom_id)

      # Verify both belong to the same school
      unless teacher.school_id == current_user.school_id && classroom.school_id == current_user.school_id
        raise Pundit::NotAuthorizedError
      end

      ct = ClassroomTeacher.find_or_initialize_by(teacher: teacher, classroom: classroom)
      ct.role = role

      if ct.save
        { classroom_teacher: ct, errors: [] }
      else
        {
          classroom_teacher: nil,
          errors: ct.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
