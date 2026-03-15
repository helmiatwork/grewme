# app/

## Responsibility
Main application directory following Rails conventions. Contains all domain logic organized by layer: models (data), graphql (API), services (business logic), jobs (async), policies (authorization), controllers (HTTP), channels (WebSocket), mailers (email), and avo (admin).

## Design
- **GraphQL-first**: All client interactions go through `app/graphql/` — controllers are minimal
- **Service layer**: Complex business logic extracted to `app/services/`
- **Background processing**: Async operations in `app/jobs/` via Solid Queue
- **Authorization layer**: `app/policies/` with Pundit for every resource
- **Admin panel**: `app/avo/` provides full CRUD for all models

## Flow
```
HTTP Request → controllers/ → graphql/ (schema → mutations/queries → types)
                                  ↓
                            policies/ (authorization)
                                  ↓
                            services/ (business logic)
                                  ↓
                            models/ (data access)
                                  ↓
                            jobs/ (async processing)
                                  ↓
                         channels/ (real-time broadcast)
```

## Integration
- All subdirectories work together through the GraphQL request lifecycle
- See individual codemap.md files in each subdirectory for detailed documentation
