# frozen_string_literal: true

module Mutations
  class RequestAccountDeletion < BaseMutation
    argument :reason, String, required: false

    field :deletion_request, Types::AccountDeletionRequestType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(reason: nil)
      authenticate!

      # Check for existing pending request
      existing = AccountDeletionRequest.find_by(user_type: current_user.class.name, user_id: current_user.id, status: :pending)
      if existing
        return { errors: [ { message: "You already have a pending deletion request", path: [ "base" ] } ] }
      end

      request = AccountDeletionRequest.new(
        user_type: current_user.class.name,
        user_id: current_user.id,
        reason: reason
      )

      if request.save
        AuditLogger.log(
          event_type: :ACCOUNT_DELETION_REQUESTED,
          action: "request_account_deletion",
          user: current_user,
          resource: request,
          request: context[:request]
        )
        { deletion_request: request, errors: [] }
      else
        { errors: request.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
