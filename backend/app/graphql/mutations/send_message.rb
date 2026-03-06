# frozen_string_literal: true

module Mutations
  class SendMessage < BaseMutation
    argument :conversation_id, ID, required: true
    argument :body, String, required: true
    argument :signed_blob_ids, [ String ], required: false

    field :message, Types::MessageType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(conversation_id:, body:, signed_blob_ids: nil)
      authenticate!

      conversation = Conversation.find(conversation_id)
      raise Pundit::NotAuthorizedError unless ConversationPolicy.new(current_user, conversation).show?

      message = conversation.messages.build(
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
