# config/

## Responsibility
Rails application configuration: routes, initializers, environment settings, database config, credentials, and locales.

## Design
- **routes.rb**: Defines POST `/graphql`, mounts Avo at `/avo`, mounts ActionCable at `/cable`
- **initializers/**: Gem-specific configuration (Devise, Pundit, Sentry, RackAttack, Flipper, CORS, etc.)
- **environments/**: Per-environment settings (development, test, production)
- **database.yml**: PostgreSQL connection config
- **credentials.yml.enc**: Encrypted secrets (JWT secret, API keys)

## Flow
Rails boot → Load environment config → Run initializers → Load routes → Application ready

## Integration
- **routes.rb**: Entry point for all HTTP/WS requests
- **initializers/role_permissions.rb**: Defines RBAC defaults consumed by Pundit policies
- **initializers/devise.rb**: Configures JWT token strategy
- **initializers/sentry.rb**: Error tracking configuration
- **initializers/rack_attack.rb**: Rate limiting rules
