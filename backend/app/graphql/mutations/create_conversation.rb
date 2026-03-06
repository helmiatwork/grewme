# frozen_string_literal: true

module Mutations
  class CreateConversation < BaseMutation
    argument :student_id, ID, required: true
    argument :parent_id, ID, required: false
    argument :teacher_id, ID, required: false

    field :conversation, Types::ConversationType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(student_id:, parent_id: nil, teacher_id: nil)
      authenticate!

      student = Student.find(student_id)

      if current_user.teacher?
        resolved_teacher_id = current_user.id
        resolved_parent_id = parent_id || student.parent_students.first&.parent_id
        raise GraphQL::ExecutionError, "No parent found for this student" unless resolved_parent_id
      elsif current_user.parent?
        resolved_parent_id = current_user.id
        # Find the primary teacher for the student's current classroom
        classroom = student.classrooms.first
        raise GraphQL::ExecutionError, "Student has no classroom" unless classroom
        resolved_teacher_id = teacher_id || classroom.classroom_teachers.find_by(role: "primary")&.teacher_id || classroom.classroom_teachers.first&.teacher_id
        raise GraphQL::ExecutionError, "No teacher found for this classroom" unless resolved_teacher_id
      else
        raise Pundit::NotAuthorizedError
      end

      conversation = Conversation.find_or_create_by!(
        student_id: student_id,
        parent_id: resolved_parent_id,
        teacher_id: resolved_teacher_id
      )

      { conversation: conversation, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      {
        conversation: nil,
        errors: [ { message: e.message, path: [ "base" ] } ]
      }
    end
  end
end
