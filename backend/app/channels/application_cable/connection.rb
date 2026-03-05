# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      token = request.params[:token]
      reject_unauthorized_connection unless token

      payload = JWT.decode(
        token,
        Rails.application.credentials.devise_jwt_secret_key,
        true,
        algorithm: "HS256"
      ).first

      klass = payload["type"]&.safe_constantize
      reject_unauthorized_connection unless klass && [ Teacher, Parent, SchoolManager ].include?(klass)

      user = klass.find_by(id: payload["sub"])
      reject_unauthorized_connection unless user

      # Check JTI deny list
      if defined?(JwtDenylist) && JwtDenylist.exists?(jti: payload["jti"])
        reject_unauthorized_connection
      end

      user
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      reject_unauthorized_connection
    end
  end
end
