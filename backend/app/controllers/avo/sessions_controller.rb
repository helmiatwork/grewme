module Avo
  class SessionsController < ActionController::Base
    layout false

    def new
      # Simple login form
    end

    def create
      admin = AdminUser.find_by(email: params[:email])
      if admin&.valid_password?(params[:password])
        session[:admin_user_id] = admin.id
        redirect_to "/avo"
      else
        flash[:alert] = "Invalid email or password"
        redirect_to "/avo/sign_in"
      end
    end

    def destroy
      session.delete(:admin_user_id)
      redirect_to "/avo/sign_in"
    end
  end
end
