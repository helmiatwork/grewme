# front-end/src/

## Responsibility
Root source directory for the SvelteKit web application. Contains the app entry point (`app.html`), global layout, all route pages, and the shared library. The only directory SvelteKit's Vite compiler reads during build.

## Design
- **File-based routing**: each `routes/<path>/+page.svelte` becomes a URL; server logic in `+page.server.ts`
- **`$lib` alias**: any import `from '$lib/...'` maps to `src/lib/`; used for components, stores, API client
- **Global layout**: `routes/+layout.svelte` wraps all pages; `routes/+layout.server.ts` enforces auth on server side
- **API proxy routes**: `routes/api/` endpoints proxy requests to the Rails backend (avoids CORS, handles cookies)

## Flow
1. Browser requests URL → SvelteKit matches route in `routes/`
2. `+layout.server.ts` runs first (JWT auth check, user type guard)
3. `+page.server.ts` loads page data (GraphQL fetch server-side)
4. `+page.svelte` renders with loaded data + `$lib` components

## Integration
- **Sub-maps**: [routes/](routes/codemap.md) | [lib/](lib/codemap.md)
- **Backend**: GraphQL queries via `$lib/api/client.ts` → `routes/api/graphql/`
- **Auth**: JWT cookies set/cleared via `routes/api/auth/`
