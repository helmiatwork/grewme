Sentry.init do |config|
  config.dsn = Rails.application.credentials.dig(:sentry, :dsn) || ENV["SENTRY_DSN"]
  config.breadcrumbs_logger = [ :active_support_logger, :http_logger ]
  config.environment = Rails.env
  config.enabled_environments = %w[production staging]

  # Performance monitoring — sample 10% of transactions
  config.traces_sample_rate = 0.1

  # Filter sensitive parameters
  config.send_default_pii = false

  # Set release version from git SHA or env
  config.release = ENV.fetch("RAILWAY_GIT_COMMIT_SHA", nil) ||
    ENV.fetch("GIT_COMMIT_SHA", nil) ||
    `git rev-parse HEAD 2>/dev/null`.strip.presence

  # Exclude common noise
  config.excluded_exceptions += [
    "ActionController::RoutingError",
    "ActiveRecord::RecordNotFound",
    "Pundit::NotAuthorizedError"
  ]

  # Scrub sensitive data from breadcrumbs
  config.before_breadcrumb = lambda do |breadcrumb, _hint|
    if breadcrumb.category == "net.http"
      breadcrumb.data&.delete("headers")
    end
    breadcrumb
  end
end
