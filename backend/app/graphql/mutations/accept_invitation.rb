# frozen_string_literal: true

module Mutations
  class AcceptInvitation < BaseMutation
    argument :token, String, required: true
    argument :name, String, required: true
    argument :password, String, required: true
    argument :password_confirmation, String, required: true

    field :access_token, String
    field :user, Types::UserUnion
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(token:, name:, password:, password_confirmation:)
      invitation = Invitation.find_by(token: token)

      unless invitation
        return { errors: [ { message: "Invalid invitation token", path: [ "token" ] } ] }
      end

      if invitation.expired? || !invitation.pending?
        return { errors: [ { message: "Invitation has expired or already been used", path: [ "token" ] } ] }
      end

      teacher = Teacher.new(
        name: name,
        email: invitation.email,
        password: password,
        password_confirmation: password_confirmation,
        school: invitation.school
      )

      unless teacher.save
        return { errors: teacher.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end

      invitation.accept!(teacher)

      access_token = generate_jwt_for(teacher)
      { access_token: access_token, user: teacher, errors: [] }
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
