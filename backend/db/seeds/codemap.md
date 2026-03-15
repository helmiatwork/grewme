# db/seeds/

## Responsibility
Development and test seed data. Creates sample schools, teachers, parents, students, classrooms, curriculum, and assessment data for local development.

## Design
- Idempotent seed scripts (find_or_create_by where possible)
- Realistic sample data for all domain models

## Flow
`rails db:seed` → Creates sample records → Development environment ready

## Integration
- **Creates instances of**: All major models for development testing
