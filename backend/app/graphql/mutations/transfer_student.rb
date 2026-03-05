# frozen_string_literal: true

module Mutations
  class TransferStudent < BaseMutation
    argument :student_id, ID, required: true
    argument :from_classroom_id, ID, required: true
    argument :to_classroom_id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(student_id:, from_classroom_id:, to_classroom_id:)
      authenticate!
      raise GraphQL::ExecutionError, "Only school managers can do this" unless current_user.school_manager?

      student = Student.find(student_id)
      from_classroom = Classroom.find(from_classroom_id)
      to_classroom = Classroom.find(to_classroom_id)

      # Verify both classrooms belong to the school
      unless from_classroom.school_id == current_user.school_id && to_classroom.school_id == current_user.school_id
        raise Pundit::NotAuthorizedError
      end

      # Deactivate current enrollment
      current_enrollment = ClassroomStudent.find_by!(student: student, classroom: from_classroom, status: :active)
      current_enrollment.update!(status: :transferred)

      # Create new enrollment
      ClassroomStudent.create!(
        student: student,
        classroom: to_classroom,
        status: :active,
        academic_year: current_enrollment.academic_year,
        enrolled_at: Date.today
      )

      { success: true, errors: [] }
    end
  end
end
