# app/avo/resources/

## Responsibility
Avo resource definitions — one per ActiveRecord model. Configures which fields are displayed, searchable, filterable in the admin panel.

## Design
- Each resource inherits from `Avo::BaseResource`
- Defines `fields` block with field types (text, number, belongs_to, has_many, etc.)
- Custom actions for admin operations
- Scoped to admin users only

## Flow
Avo resolves resource class from model → Renders fields → Handles CRUD via ActiveRecord

## Integration
- **One resource per model**: Teacher, Student, Classroom, Exam, etc.
- **Depends on**: ActiveRecord models and their associations
