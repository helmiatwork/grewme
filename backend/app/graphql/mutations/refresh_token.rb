# frozen_string_literal: true

module Mutations
  class RefreshToken < BaseMutation
    argument :refresh_token, String, required: true
    argument :role, String, required: true, description: "teacher or parent"

    field :access_token, String
    field :refresh_token, String
    field :expires_in, Integer
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(refresh_token:, role:)
      type = (role == "teacher") ? "Teacher" : "Parent"
      token_digest = Digest::SHA256.hexdigest(refresh_token)
      token_record = ::RefreshToken.find_by(token_digest: token_digest, authenticatable_type: type)

      if token_record.nil? || !token_record.active?
        return { errors: [ { message: "Invalid or expired refresh token", path: [ "refreshToken" ] } ] }
      end

      token_record.revoke!
      user = token_record.authenticatable

      new_access_token = generate_jwt_for(user)
      new_refresh = user.refresh_tokens.create!(
        ip_address: context[:request].remote_ip,
        user_agent: context[:request].user_agent
      )

      {
        access_token: new_access_token,
        refresh_token: new_refresh.raw_token,
        expires_in: jwt_expiration_time,
        errors: []
      }
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

    def jwt_expiration_time
      Devise::JWT.config.expiration_time
    end
  end
end
