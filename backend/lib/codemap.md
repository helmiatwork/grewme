# lib/

## Responsibility
Custom libraries and utilities: error classes, Rake tasks, and shared code not specific to Rails conventions.

## Design
- **ApiError**: Custom error class hierarchy for structured API error responses
- **tasks/**: Rake tasks for maintenance operations (data cleanup, migrations, etc.)

## Flow
Code requires lib files → Utilities used throughout application

## Integration
- **ApiError**: Used by controllers and GraphQL error handling
- **Rake tasks**: Run via `rails task_name` for maintenance
