# config/environments/

## Responsibility
Environment-specific Rails configuration overriding defaults for development, test, and production.

## Design
- **development.rb**: Eager loading off, verbose logging, local mail delivery
- **test.rb**: Eager loading off, test-specific caching, null mailer
- **production.rb**: Eager loading on, Sentry enabled, Lograge JSON logging, Solid Queue/Cache/Cable, force SSL

## Flow
`RAILS_ENV` determines which file loads → Overrides `config/application.rb` defaults

## Integration
- Production enables: Sentry, Lograge, Solid Stack, SSL, compiled assets
- Development enables: Debug tools, verbose SQL logging, local services
