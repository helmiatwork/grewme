# frozen_string_literal: true

module Mutations
  class DeclineConsent < BaseMutation
    argument :input, Types::DeclineConsentInputType, required: true

    field :consent, Types::ConsentType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      consent = Consent.find_by(token: input.token)

      unless consent
        return { errors: [ { message: "Invalid consent token", path: [ "token" ] } ] }
      end

      unless consent.pending?
        return { errors: [ { message: "Consent has already been processed", path: [ "token" ] } ] }
      end

      consent.decline!
      AuditLogger.log(
        event_type: :CONSENT_DECLINED,
        action: "decline_consent",
        resource: consent,
        request: context[:request]
      )
      { consent: consent, errors: [] }
    end
  end
end
