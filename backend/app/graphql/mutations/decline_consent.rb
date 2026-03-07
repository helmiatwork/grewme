# frozen_string_literal: true

module Mutations
  class DeclineConsent < BaseMutation
    argument :token, String, required: true

    field :consent, Types::ConsentType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(token:)
      consent = Consent.find_by(token: token)

      unless consent
        return { errors: [ { message: "Invalid consent token", path: [ "token" ] } ] }
      end

      unless consent.pending?
        return { errors: [ { message: "Consent has already been processed", path: [ "token" ] } ] }
      end

      consent.decline!
      { consent: consent, errors: [] }
    end
  end
end
