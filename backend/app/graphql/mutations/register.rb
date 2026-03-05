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
      attrs = input.to_h.except(:role)
      klass = (input.role == "teacher") ? Teacher : Parent
      user = klass.new(attrs)

      unless user.save
        return {
          errors: user.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end

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
