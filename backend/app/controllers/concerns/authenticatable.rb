module Authenticatable
  extend ActiveSupport::Concern

  private

  def authenticate_user!
    token = extract_token
    if token.blank?
      render json: { error: "Unauthorized" }, status: :unauthorized
      return
    end

    payload = decode_jwt(token)
    if payload.nil?
      render json: { error: "Unauthorized" }, status: :unauthorized
      return
    end

    @current_user = find_authenticatable(payload)

    unless @current_user
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def extract_token
    header = request.headers["Authorization"]
    header&.split(" ")&.last
  end

  def authorize_role!(*roles)
    unless roles.map(&:to_s).include?(current_user.role)
      render json: { error: "Forbidden" }, status: :forbidden
    end
  end

  def decode_jwt(token)
    secret = Rails.application.credentials.devise_jwt_secret_key!
    decoded = JWT.decode(token, secret, true, algorithm: "HS256")
    payload = HashWithIndifferentAccess.new(decoded.first)

    # Check denylist
    return nil if JwtDenylist.exists?(jti: payload[:jti])

    payload
  rescue JWT::DecodeError, JWT::ExpiredSignature => e
    Rails.logger.warn("JWT decode error: #{e.message}")
    nil
  end

  def find_authenticatable(payload)
    type = payload[:type] || payload["type"]
    sub = payload[:sub] || payload["sub"]

    if sub && type
      klass = type.safe_constantize
      return nil unless klass && [ Teacher, Parent ].include?(klass)
      klass.find_by(id: sub)
    end
  end
end
