# frozen_string_literal: true

module Mutations
  class RevokeConsent < BaseMutation
    argument :input, Types::RevokeConsentInputType, required: true

    field :consent, Types::ConsentType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      unless current_user.parent?
        raise GraphQL::ExecutionError, "Only parents can revoke consent"
      end

      consent = Consent.find(input.id)
      unless consent.parent_id == current_user.id
        raise GraphQL::ExecutionError, "You can only revoke your own consent"
      end

      consent.revoke!
      AuditLogger.log(
        event_type: :CONSENT_REVOKED,
        action: "revoke_consent",
        user: current_user,
        resource: consent,
        request: context[:request]
      )
      { consent: consent, errors: [] }
    end
  end
end
