# frozen_string_literal: true

module Mutations
  class RequestConsent < BaseMutation
    argument :input, Types::RequestConsentInputType, required: true

    field :consent, Types::ConsentType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      unless current_user.teacher?
        raise GraphQL::ExecutionError, "Only teachers can request consent"
      end

      student = Student.find(input.student_id)
      consent = Consent.new(
        student: student,
        parent_email: input.parent_email,
        consent_method: "email_plus"
      )

      if consent.save
        ConsentMailer.consent_request(consent).deliver_later
        AuditLogger.log(
          event_type: :CONSENT_REQUESTED,
          action: "request_consent",
          user: current_user,
          resource: consent,
          request: context[:request]
        )
        { consent: consent, errors: [] }
      else
        { errors: consent.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
