# app/graphql/

## Responsibility
GraphQL API layer: schema definition, base types, Dataloader configuration, error handling. This is the primary interface between clients and the backend — all reads and writes go through this layer.

## Design
- **GrewmeSchema**: Root schema class with `GraphQL::Dataloader` for N+1 prevention, `max_depth: 15` and `max_complexity: 300` query limits
- **Base classes**: BaseObject, BaseField, BaseArgument, BaseInputObject, BaseScalar, BaseEnum, BaseUnion, BaseInterface, BaseConnection, BaseEdge — ensure consistent behavior across all types
- **Error handling**: Rescues `Pundit::NotAuthorizedError` → returns GraphQL error; rescues `ActiveRecord::RecordNotFound` → returns null
- **Context**: Every query receives `{ current_user:, request: }` from GraphqlController
- **Global ID**: `GlobalID` resolution for node identification

## Flow
1. GraphqlController receives POST /graphql
2. Extracts JWT token → decodes → finds current_user
3. Calls `GrewmeSchema.execute(query, variables:, context:)`
4. Schema dispatches to QueryType (reads) or MutationType (writes)
5. Resolvers/mutations use context[:current_user] for auth
6. Dataloader batches database queries
7. Types serialize models to JSON response

## Integration
- **Entry point**: GraphqlController.execute
- **Contains**: types/ (120 files), mutations/ (40 files), resolvers/
- **Depends on**: Models, Services, Policies, Jobs
- **Consumed by**: SvelteKit frontend, mobile apps (future)
