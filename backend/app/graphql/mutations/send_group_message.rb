# frozen_string_literal: true

module Mutations
  class SendGroupMessage < BaseMutation
    argument :group_conversation_id, ID, required: true
    argument :body, String, required: true
    argument :signed_blob_ids, [ String ], required: false

    field :message, Types::GroupMessageType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(group_conversation_id:, body:, signed_blob_ids: nil)
      authenticate!

      group_conversation = GroupConversation.find(group_conversation_id)
      classroom = group_conversation.classroom

      # Only teachers can send group messages (parents are read-only)
      unless current_user.teacher? && classroom.classroom_teachers.exists?(teacher_id: current_user.id)
        raise Pundit::NotAuthorizedError
      end

      message = group_conversation.group_messages.build(
        sender: current_user,
        body: body
      )

      if message.save
        if signed_blob_ids.present?
          blobs = signed_blob_ids.map { |id| ActiveStorage::Blob.find_signed!(id) }
          message.attachments.attach(blobs)
        end
        { message: message, errors: [] }
      else
        {
          message: nil,
          errors: message.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
