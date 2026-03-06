# frozen_string_literal: true

module Mutations
  class CreateGroupConversation < BaseMutation
    argument :classroom_id, ID, required: true

    field :group_conversation, Types::GroupConversationType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(classroom_id:)
      authenticate!

      classroom = Classroom.find(classroom_id)

      # Only teachers in this classroom can create group conversations
      unless current_user.teacher? && classroom.classroom_teachers.exists?(teacher_id: current_user.id)
        raise Pundit::NotAuthorizedError
      end

      group_conversation = GroupConversation.find_or_create_by!(classroom_id: classroom.id)

      { group_conversation: group_conversation, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      {
        group_conversation: nil,
        errors: [ { message: e.message, path: [ "base" ] } ]
      }
    end
  end
end
