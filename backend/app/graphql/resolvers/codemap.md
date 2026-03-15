# app/graphql/resolvers/

## Responsibility
Dedicated resolver classes for complex query fields that need more logic than inline field definitions. Encapsulates data fetching, filtering, and aggregation logic.

## Design
- Resolvers inherit from `GraphQL::Schema::Resolver` or are plain Ruby methods on QueryType
- Used for queries requiring joins, aggregations, or multi-step data assembly (e.g., radar chart data, curriculum trees)
- Pundit Scopes applied within resolvers for authorization

## Flow
1. QueryType field delegates to resolver
2. Resolver applies Pundit Scope for authorization
3. Resolver queries models with filters/joins
4. Returns typed result (single object, connection, or custom type)

## Integration
- **Called by**: QueryType field definitions
- **Uses**: ActiveRecord scopes, Pundit Scopes
- **Returns**: GraphQL types
