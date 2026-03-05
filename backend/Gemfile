source "https://rubygems.org"

# Core
gem "rails", "~> 8.1.2"
gem "pg", "~> 1.6"
gem "puma", ">= 6.0"
gem "bootsnap", require: false
gem "tzinfo-data", platforms: %i[windows jruby]
gem "image_processing", "~> 1.14"

# Solid adapters (PostgreSQL-backed cache, queue, cable)
gem "solid_cache"
gem "solid_queue"
gem "solid_cable"

# Deploy
gem "kamal", require: false
gem "thruster", require: false

# Auth & authorization
gem "devise", "~> 5.0"
gem "devise-jwt", "~> 0.12"
gem "pundit", "~> 2.5"

# API & serialization
gem "alba", "~> 3.9"
gem "graphql", "~> 2.5"
gem "rack-cors"
gem "rack-attack", "~> 6.8"

# Database & migrations
gem "scenic", "~> 1.8"
gem "strong_migrations", "~> 2.5"
gem "paper_trail", "~> 17.0"

# Security
gem "secure_headers", "~> 7.0"
gem "lockbox", "~> 2.1"
gem "blind_index", "~> 2.3"

# Logging & monitoring
gem "lograge", "~> 0.14"
gem "sentry-ruby", "~> 5.22"
gem "sentry-rails", "~> 5.22"

# Activity tracking
gem "public_activity", "~> 3.0"

# Utilities
gem "countries", "~> 7.1"
gem "ruby_llm", "~> 1.2"

# Admin
gem "avo", "~> 3.16"

group :development, :test do
  gem "debug", platforms: %i[mri windows], require: "debug/prelude"
  gem "dotenv-rails", "~> 3.1"
  gem "bundler-audit", require: false
  gem "brakeman", require: false
  gem "rubocop-rails-omakase", require: false
end

group :test do
  gem "simplecov", require: false
  gem "factory_bot_rails", "~> 6.4"
  gem "faker", "~> 3.5"
  gem "shoulda-matchers", "~> 6.4"
  gem "shoulda-context", "~> 2.0"
  gem "database_cleaner-active_record", "~> 2.2"
  gem "webmock", "~> 3.24"
  gem "vcr", "~> 6.3"
  gem "mocha", "~> 2.7"
  gem "timecop", "~> 0.9"
end
