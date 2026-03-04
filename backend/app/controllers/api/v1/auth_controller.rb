module Api
  module V1
    class AuthController < Api::V1::BaseController
      skip_before_action :authenticate_user!, only: [ :login, :register, :refresh ]
      skip_after_action :verify_authorized
      skip_after_action :verify_policy_scoped

      def login
        user = User.find_by(email: params[:email])

        if user&.authenticate(params[:password])
          access_token = JwtService.encode({ user_id: user.id })
          refresh = user.refresh_tokens.create!(
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )
          render json: {
            access_token: access_token,
            refresh_token: refresh.raw_token,
            expires_in: JwtService::ACCESS_TOKEN_EXPIRY.to_i,
            user: user_json(user)
          }
        else
          render json: { error: { code: "invalid_credentials", message: "Invalid email or password" } }, status: :unauthorized
        end
      end

      def register
        user = User.new(register_params)

        if user.save
          access_token = JwtService.encode({ user_id: user.id })
          refresh = user.refresh_tokens.create!(
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )
          render json: {
            access_token: access_token,
            refresh_token: refresh.raw_token,
            expires_in: JwtService::ACCESS_TOKEN_EXPIRY.to_i,
            user: user_json(user)
          }, status: :created
        else
          render json: { error: { code: "validation_failed", message: "Validation failed", details: user.errors.full_messages } }, status: :unprocessable_entity
        end
      end

      def refresh
        raw_token = params[:refresh_token]
        if raw_token.blank?
          return render json: { error: { code: "missing_token", message: "Refresh token is required" } }, status: :bad_request
        end

        token_digest = Digest::SHA256.hexdigest(raw_token)
        refresh_token = RefreshToken.find_by(token_digest: token_digest)

        if refresh_token.nil? || !refresh_token.active?
          return render json: { error: { code: "invalid_token", message: "Invalid or expired refresh token" } }, status: :unauthorized
        end

        # Rotate: revoke old, issue new
        refresh_token.revoke!

        user = refresh_token.user
        new_access_token = JwtService.encode({ user_id: user.id })
        new_refresh = user.refresh_tokens.create!(
          ip_address: request.remote_ip,
          user_agent: request.user_agent
        )

        render json: {
          access_token: new_access_token,
          refresh_token: new_refresh.raw_token,
          expires_in: JwtService::ACCESS_TOKEN_EXPIRY.to_i
        }
      end

      private

      def register_params
        params.permit(:name, :email, :password, :password_confirmation)
      end

      def user_json(user)
        { id: user.id, name: user.name, email: user.email, role: user.role }
      end
    end
  end
end
