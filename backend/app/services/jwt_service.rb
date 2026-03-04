class JwtService
  ALGORITHM = "HS256"
  ACCESS_TOKEN_EXPIRY = 15.minutes

  def self.encode(payload, exp: ACCESS_TOKEN_EXPIRY.from_now)
    payload[:exp] = exp.to_i
    payload[:iat] = Time.current.to_i
    payload[:jti] = SecureRandom.uuid
    JWT.encode(payload, secret_key, ALGORITHM)
  end

  def self.decode(token)
    decoded = JWT.decode(token, secret_key, true, algorithm: ALGORITHM)
    payload = HashWithIndifferentAccess.new(decoded.first)

    # Check if token has been revoked
    return nil if token_revoked?(payload[:jti])

    payload
  rescue JWT::DecodeError, JWT::ExpiredSignature => e
    Rails.logger.warn("JWT decode error: #{e.message}")
    nil
  end

  def self.secret_key
    Rails.application.credentials.secret_key_base ||
      raise("SECRET_KEY_BASE not configured. Run `rails credentials:edit`")
  end

  def self.revoke_access_token(jti, exp)
    ttl = [ exp - Time.current.to_i, 0 ].max
    Rails.cache.write("revoked_jwt:#{jti}", true, expires_in: ttl.seconds) if ttl > 0
  end

  def self.token_revoked?(jti)
    return false if jti.blank?
    Rails.cache.exist?("revoked_jwt:#{jti}")
  end
end
