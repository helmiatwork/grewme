Sentry.init do |config|
  config.dsn = "https://3461042ac89eb721a30eb9f01b37b720@o470098.ingest.us.sentry.io/4510991837167616"
  config.breadcrumbs_logger = [ :active_support_logger, :http_logger ]
  config.send_default_pii = true

  config.traces_sample_rate = Rails.env.production? ? 0.2 : 1.0
  config.profiles_sample_rate = Rails.env.production? ? 0.2 : 1.0

  config.environment = Rails.env
  config.enabled_environments = %w[production staging development]
end
