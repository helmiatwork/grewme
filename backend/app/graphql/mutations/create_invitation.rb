# frozen_string_literal: true

module Mutations
  class CreateInvitation < BaseMutation
    argument :email, String, required: true
    argument :role, String, required: true

    field :invitation, Types::InvitationType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(email:, role:)
      authenticate!
      unless current_user.school_manager?
        raise GraphQL::ExecutionError, "Only school managers can create invitations"
      end

      invitation = Invitation.new(
        email: email,
        role: role,
        inviter: current_user,
        school: current_user.school
      )

      if invitation.save
        InvitationMailer.teacher_invitation(invitation).deliver_later
        AuditLogger.log(
          event_type: :INVITATION_SENT,
          action: "create_invitation",
          user: current_user,
          resource: invitation,
          metadata: { email: email, role: role },
          request: context[:request]
        )
        { invitation: invitation, errors: [] }
      else
        { errors: invitation.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
