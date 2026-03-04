module JwtIssuable
  extend ActiveSupport::Concern

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
