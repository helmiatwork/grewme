# frozen_string_literal: true

module Mutations
  class RevokeInvitation < BaseMutation
    argument :id, ID, required: true

    field :invitation, Types::InvitationType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      authenticate!
      unless current_user.school_manager?
        raise GraphQL::ExecutionError, "Only school managers can revoke invitations"
      end

      invitation = current_user.school.invitations.find(id)
      invitation.update!(status: :revoked)
      { invitation: invitation, errors: [] }
    end
  end
end
