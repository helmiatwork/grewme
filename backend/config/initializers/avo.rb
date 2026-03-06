# For more information regarding these settings check out our docs https://docs.avohq.io
Avo.configure do |config|
  config.root_path = "/avo"
  config.app_name = "GrewMe Admin"

  ## == Authentication ==
  config.current_user_method = :current_admin_user
  config.authenticate_with do
    redirect_to "/avo/sign_in" unless current_admin_user
  end

  ## == Authorization ==
  config.authorization_client = nil
  config.explicit_authorization = false

  ## == Sign out ==
  config.sign_out_path_name = :avo_sign_out_path

  ## == Customization ==
  config.click_row_to_view_record = true

  ## == Breadcrumbs ==
  config.display_breadcrumbs = true
  config.set_initial_breadcrumbs do
    add_breadcrumb "Home", "/avo"
  end
end

# Add current_admin_user to Avo's controller
Rails.application.config.to_prepare do
  Avo::ApplicationController.class_eval do
    def current_admin_user
      return unless session[:admin_user_id]
      @current_admin_user ||= AdminUser.find_by(id: session[:admin_user_id])
    end
    helper_method :current_admin_user
  end
end
