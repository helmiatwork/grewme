# db/migrate/

## Responsibility
Sequential database migration files defining schema evolution. Each migration adds, modifies, or removes tables/columns/indexes.

## Design
- Uses StrongMigrations gem for safety (prevents dangerous operations in production)
- Migrations are timestamped and run in order
- Reversible where possible (up/down methods)

## Flow
`rails db:migrate` → Runs pending migrations → Updates schema.rb

## Integration
- **Produces**: schema.rb (database state)
- **Consumed by**: ActiveRecord models (column mappings)
