# app/avo/

## Responsibility
Avo 3.16 admin panel configuration. Provides a full CRUD admin interface for all domain models without writing custom admin views.

## Design
- Resource definitions in `resources/` — one per model
- Custom fields, filters, and actions where needed
- Admin-only access (not exposed to regular users)

## Flow
Admin navigates to /avo → Avo renders dashboard → Selects resource → CRUD operations → Direct model manipulation

## Integration
- **Resources wrap**: All 54 ActiveRecord models
- **Authentication**: Separate session-based auth (not JWT)
- **Mounted at**: `/avo` in routes.rb
