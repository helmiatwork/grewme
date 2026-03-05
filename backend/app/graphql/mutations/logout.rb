# frozen_string_literal: true

module Mutations
  class Logout < BaseMutation
    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve
      authenticate!

      # Decode current token to get jti
      token = context[:request].headers["Authorization"]&.split(" ")&.last
      if token
        secret = Rails.application.credentials.devise_jwt_secret_key!
        decoded = JWT.decode(token, secret, true, algorithm: "HS256")
        payload = decoded.first
        JwtDenylist.create!(jti: payload["jti"], exp: Time.at(payload["exp"]))
      end

      # Revoke all active refresh tokens
      current_user.refresh_tokens.active.find_each(&:revoke!)

      { success: true, errors: [] }
    end
  end
end
