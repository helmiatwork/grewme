module Api
  module V1
    module Parents
      class AuthController < Api::V1::BaseController
        include JwtIssuable

        skip_before_action :authenticate_user!, only: [ :login, :register, :refresh ]

        def login
          parent = Parent.find_by(email: params[:email])

          if parent&.valid_password?(params[:password])
            access_token = generate_jwt_for(parent)
            refresh = parent.refresh_tokens.create!(
              ip_address: request.remote_ip,
              user_agent: request.user_agent
            )
            render json: {
              access_token: access_token,
              refresh_token: refresh.raw_token,
              expires_in: jwt_expiration_time,
              user: user_json(parent)
            }
          else
            render json: { error: { code: "invalid_credentials", message: "Invalid email or password" } }, status: :unauthorized
          end
        end

        def register
          parent = Parent.new(register_params)

          if parent.save
            access_token = generate_jwt_for(parent)
            refresh = parent.refresh_tokens.create!(
              ip_address: request.remote_ip,
              user_agent: request.user_agent
            )
            render json: {
              access_token: access_token,
              refresh_token: refresh.raw_token,
              expires_in: jwt_expiration_time,
              user: user_json(parent)
            }, status: :created
          else
            render json: { error: { code: "validation_failed", message: "Validation failed", details: parent.errors.full_messages } },
              status: :unprocessable_entity
          end
        end

        def refresh
          raw_token = params[:refresh_token]
          if raw_token.blank?
            return render json: { error: { code: "missing_token", message: "Refresh token is required" } }, status: :bad_request
          end

          token_digest = Digest::SHA256.hexdigest(raw_token)
          refresh_token = RefreshToken.find_by(token_digest: token_digest, authenticatable_type: "Parent")

          if refresh_token.nil? || !refresh_token.active?
            return render json: { error: { code: "invalid_token", message: "Invalid or expired refresh token" } }, status: :unauthorized
          end

          refresh_token.revoke!

          parent = refresh_token.authenticatable
          new_access_token = generate_jwt_for(parent)
          new_refresh = parent.refresh_tokens.create!(
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )

          render json: {
            access_token: new_access_token,
            refresh_token: new_refresh.raw_token,
            expires_in: jwt_expiration_time
          }
        end

        def logout
          token = extract_token
          payload = decode_jwt(token)
          if payload
            JwtDenylist.create!(jti: payload[:jti], exp: Time.at(payload[:exp]))
          end

          current_user.refresh_tokens.active.find_each(&:revoke!)

          render json: { message: "Logged out successfully" }
        end

        private

        def register_params
          params.permit(:name, :email, :password, :password_confirmation, :phone)
        end

        def user_json(parent)
          { id: parent.id, name: parent.name, email: parent.email, role: parent.role }
        end
      end
    end
  end
end
