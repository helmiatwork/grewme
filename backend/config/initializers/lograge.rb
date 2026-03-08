Rails.application.configure do
  config.lograge.enabled = true
  config.lograge.formatter = Lograge::Formatters::Json.new

  # Include request parameters (filtered)
  config.lograge.custom_options = lambda do |event|
    options = {
      request_id: event.payload[:request_id],
      ip: event.payload[:ip],
      user_agent: event.payload[:user_agent]
    }

    # Add user info if available
    if event.payload[:current_user]
      user = event.payload[:current_user]
      options[:user_id] = user.id
      options[:user_type] = user.class.name
    end

    # Add exception info if present
    if event.payload[:exception]
      options[:exception] = event.payload[:exception].first
      options[:exception_message] = event.payload[:exception].last
    end

    # Add params (filtered)
    params = event.payload[:params]&.except("controller", "action", "format")
    options[:params] = params if params.present?

    options
  end

  # Silence health check requests
  config.lograge.ignore_actions = [ "Rails::HealthController#show" ]
end
