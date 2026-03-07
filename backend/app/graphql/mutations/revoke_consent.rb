# frozen_string_literal: true

module Mutations
  class RevokeConsent < BaseMutation
    argument :id, ID, required: true

    field :consent, Types::ConsentType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      authenticate!
      unless current_user.parent?
        raise GraphQL::ExecutionError, "Only parents can revoke consent"
      end

      consent = Consent.find(id)
      unless consent.parent_id == current_user.id
        raise GraphQL::ExecutionError, "You can only revoke your own consent"
      end

      consent.revoke!
      { consent: consent, errors: [] }
    end
  end
end
