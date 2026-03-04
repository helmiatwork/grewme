module Authenticatable
  extend ActiveSupport::Concern

  private

  def authenticate_user!
    token = extract_token
    payload = JwtService.decode(token)

    if payload.nil?
      render json: { error: "Unauthorized" }, status: :unauthorized
      return
    end

    @current_user = User.find_by(id: payload[:user_id])

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
end
