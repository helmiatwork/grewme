# app/components/

## Responsibility
ViewComponent components used by the Avo admin panel for custom UI elements.

## Design
- Components follow the ViewComponent pattern (Ruby class + template)
- Used for custom admin panel widgets and displays

## Flow
Avo renders page → Includes custom components → Component renders HTML

## Integration
- **Used by**: Avo admin panel views
- **Depends on**: ViewComponent gem
