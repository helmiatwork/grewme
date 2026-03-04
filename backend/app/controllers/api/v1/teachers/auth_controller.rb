module Api
  module V1
    module Teachers
      class AuthController < Api::V1::BaseController
        include JwtIssuable

        skip_before_action :authenticate_user!, only: [ :login, :register, :refresh ]

        def login
          teacher = Teacher.find_by(email: params[:email])

          if teacher&.valid_password?(params[:password])
            access_token = generate_jwt_for(teacher)
            refresh = teacher.refresh_tokens.create!(
              ip_address: request.remote_ip,
              user_agent: request.user_agent
            )
            render json: {
              access_token: access_token,
              refresh_token: refresh.raw_token,
              expires_in: jwt_expiration_time,
              user: user_json(teacher)
            }
          else
            render json: { error: { code: "invalid_credentials", message: "Invalid email or password" } }, status: :unauthorized
          end
        end

        def register
          teacher = Teacher.new(register_params)

          if teacher.save
            access_token = generate_jwt_for(teacher)
            refresh = teacher.refresh_tokens.create!(
              ip_address: request.remote_ip,
              user_agent: request.user_agent
            )
            render json: {
              access_token: access_token,
              refresh_token: refresh.raw_token,
              expires_in: jwt_expiration_time,
              user: user_json(teacher)
            }, status: :created
          else
            render json: { error: { code: "validation_failed", message: "Validation failed", details: teacher.errors.full_messages } },
              status: :unprocessable_entity
          end
        end

        def refresh
          raw_token = params[:refresh_token]
          if raw_token.blank?
            return render json: { error: { code: "missing_token", message: "Refresh token is required" } }, status: :bad_request
          end

          token_digest = Digest::SHA256.hexdigest(raw_token)
          refresh_token = RefreshToken.find_by(token_digest: token_digest, authenticatable_type: "Teacher")

          if refresh_token.nil? || !refresh_token.active?
            return render json: { error: { code: "invalid_token", message: "Invalid or expired refresh token" } }, status: :unauthorized
          end

          refresh_token.revoke!

          teacher = refresh_token.authenticatable
          new_access_token = generate_jwt_for(teacher)
          new_refresh = teacher.refresh_tokens.create!(
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
          # Revoke the current JWT by adding jti to denylist
          token = extract_token
          payload = decode_jwt(token)
          if payload
            JwtDenylist.create!(jti: payload[:jti], exp: Time.at(payload[:exp]))
          end

          # Revoke all active refresh tokens
          current_user.refresh_tokens.active.find_each(&:revoke!)

          render json: { message: "Logged out successfully" }
        end

        private

        def register_params
          params.permit(:name, :email, :password, :password_confirmation)
        end

        def user_json(teacher)
          { id: teacher.id, name: teacher.name, email: teacher.email, role: teacher.role }
        end
      end
    end
  end
end
