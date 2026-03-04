# frozen_string_literal: true

Devise.setup do |config|
  config.mailer_sender = "noreply@grewme.app"

  require "devise/orm/active_record"

  config.case_insensitive_keys = [ :email ]
  config.strip_whitespace_keys = [ :email ]
  config.skip_session_storage = [ :http_auth, :params_auth ]
  config.stretches = Rails.env.test? ? 1 : 12
  config.password_length = 8..128
  config.email_regexp = /\A[^@\s]+@[^@\s]+\z/
  config.sign_out_via = :delete
  config.responder.error_status = :unprocessable_entity
  config.responder.redirect_status = :see_other
  config.navigational_formats = []

  # JWT secret used by our custom JwtIssuable concern (not Devise's built-in JWT strategy)
  config.jwt do |jwt|
    jwt.secret = Rails.application.credentials.devise_jwt_secret_key!
    jwt.expiration_time = 15.minutes.to_i
  end
end
