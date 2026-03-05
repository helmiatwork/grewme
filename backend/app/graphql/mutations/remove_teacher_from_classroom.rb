# frozen_string_literal: true

module Mutations
  class RemoveTeacherFromClassroom < BaseMutation
    argument :teacher_id, ID, required: true
    argument :classroom_id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(teacher_id:, classroom_id:)
      authenticate!
      raise GraphQL::ExecutionError, "Only school managers can do this" unless current_user.school_manager?

      ct = ClassroomTeacher.find_by!(teacher_id: teacher_id, classroom_id: classroom_id)

      # Verify belongs to the same school
      unless ct.classroom.school_id == current_user.school_id
        raise Pundit::NotAuthorizedError
      end

      ct.destroy!
      { success: true, errors: [] }
    end
  end
end
