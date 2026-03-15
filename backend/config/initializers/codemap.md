# config/initializers/

## Responsibility
Gem and feature configuration executed on Rails boot. Each initializer configures a specific gem or application feature.

## Design
### Key Initializers:
- **role_permissions.rb**: `RolePermissions::DEFAULTS` hash — defines default permissions per role (teacher, parent, school_manager, admin). Consumed by Permissionable concern and Pundit policies.
- **devise.rb**: Devise authentication config — JWT strategy, token expiry, secret key
- **rack_attack.rb**: Rate limiting — throttles by IP and user for API abuse prevention
- **sentry.rb**: Sentry DSN, sample rates, environment filtering
- **cors.rb**: CORS allowed origins for frontend domains
- **flipper.rb**: Feature flag configuration
- **secure_headers.rb**: CSP and security header configuration
- **solid_queue.rb**: Background job queue configuration
- **solid_cache.rb**: Cache store configuration (10-min TTL for radar data)

## Flow
Rails boot → Each initializer runs once → Configures gem → Gem ready for use

## Integration
- **role_permissions.rb** consumed by: Permissionable concern → Pundit policies
- **devise.rb** consumed by: User models (Teacher, Parent, SchoolManager)
- **rack_attack.rb**: Middleware layer before controllers
