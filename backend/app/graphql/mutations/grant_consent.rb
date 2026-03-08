# frozen_string_literal: true

module Mutations
  class GrantConsent < BaseMutation
    argument :input, Types::GrantConsentInputType, required: true

    field :access_token, String
    field :user, Types::UserUnion
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

      if consent.expires_at < Time.current
        return { errors: [ { message: "Consent request has expired", path: [ "token" ] } ] }
      end

      # Find or create parent account
      parent = Parent.find_by(email: consent.parent_email)
      if parent.nil?
        parent = Parent.new(
          name: input.name,
          email: consent.parent_email,
          password: input.password,
          password_confirmation: input.password_confirmation
        )
        unless parent.save
          return { errors: parent.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
        end
      end

      # Grant consent and link parent to student
      consent.grant!(parent: parent, ip_address: context[:request]&.remote_ip)

      # Create parent-student link if not exists
      unless ParentStudent.exists?(parent: parent, student: consent.student)
        ParentStudent.create!(parent: parent, student: consent.student)
      end

      # Send confirmation email
      ConsentMailer.consent_confirmation(consent).deliver_later

      AuditLogger.log(
        event_type: :CONSENT_GRANTED,
        action: "grant_consent",
        user: parent,
        resource: consent,
        request: context[:request]
      )

      access_token = generate_jwt_for(parent)
      { access_token: access_token, user: parent, consent: consent, errors: [] }
    end

    private

    def generate_jwt_for(entity)
      secret = Rails.application.credentials.devise_jwt_secret_key!
      payload = entity.jwt_payload.merge(
        "jti" => SecureRandom.uuid,
        "iat" => Time.current.to_i,
        "exp" => Devise::JWT.config.expiration_time.seconds.from_now.to_i
      )
      JWT.encode(payload, secret, "HS256")
    end
  end
end
