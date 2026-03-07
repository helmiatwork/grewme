# frozen_string_literal: true

module Mutations
  class Register < BaseMutation
    argument :input, Types::RegisterInputType, required: true

    field :access_token, String
    field :refresh_token, String
    field :expires_in, Integer
    field :user, Types::UserUnion
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      if input.invitation_token.present?
        register_via_invitation(input)
      elsif input.consent_token.present?
        register_via_consent(input)
      else
        { errors: [ { message: "Registration requires an invitation_token or consent_token", path: [ "token" ] } ] }
      end
    end

    private

    def register_via_invitation(input)
      invitation = Invitation.find_by(token: input.invitation_token)

      unless invitation
        return { errors: [ { message: "Invalid invitation token", path: [ "invitationToken" ] } ] }
      end

      if invitation.expired? || !invitation.pending?
        return { errors: [ { message: "Invitation has expired or already been used", path: [ "invitationToken" ] } ] }
      end

      teacher = Teacher.new(
        name: input.name,
        email: invitation.email,
        password: input.password,
        password_confirmation: input.password_confirmation,
        school: invitation.school
      )

      unless teacher.save
        return { errors: teacher.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end

      invitation.accept!(teacher)
      AuditLogger.log(
        event_type: :ACCOUNT_CREATED,
        action: "register_via_invitation",
        user: teacher,
        request: context[:request]
      )
      issue_tokens(teacher)
    end

    def register_via_consent(input)
      consent = Consent.find_by(token: input.consent_token)

      unless consent
        return { errors: [ { message: "Invalid consent token", path: [ "consentToken" ] } ] }
      end

      unless consent.pending?
        return { errors: [ { message: "Consent has already been processed", path: [ "consentToken" ] } ] }
      end

      if consent.expires_at < Time.current
        return { errors: [ { message: "Consent request has expired", path: [ "consentToken" ] } ] }
      end

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

      consent.grant!(parent: parent, ip_address: context[:request]&.remote_ip)

      unless ParentStudent.exists?(parent: parent, student: consent.student)
        ParentStudent.create!(parent: parent, student: consent.student)
      end

      AuditLogger.log(
        event_type: :ACCOUNT_CREATED,
        action: "register_via_consent",
        user: parent,
        request: context[:request]
      )
      issue_tokens(parent)
    end

    def issue_tokens(user)
      access_token = generate_jwt_for(user)
      refresh = user.refresh_tokens.create!(
        ip_address: context[:request].remote_ip,
        user_agent: context[:request].user_agent
      )

      {
        access_token: access_token,
        refresh_token: refresh.raw_token,
        expires_in: jwt_expiration_time,
        user: user,
        errors: []
      }
    end

    def generate_jwt_for(entity)
      secret = Rails.application.credentials.devise_jwt_secret_key!
      payload = entity.jwt_payload.merge(
        "jti" => SecureRandom.uuid,
        "iat" => Time.current.to_i,
        "exp" => Devise::JWT.config.expiration_time.seconds.from_now.to_i
      )
      JWT.encode(payload, secret, "HS256")
    end

    def jwt_expiration_time
      Devise::JWT.config.expiration_time
    end
  end
end
