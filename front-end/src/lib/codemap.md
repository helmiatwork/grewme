# front-end/src/lib/

## Responsibility
Shared library for the SvelteKit frontend — all reusable code imported via the `$lib` alias. Contains the GraphQL API client, typed query/mutation wrappers, UI components, Svelte stores, and utility functions.

## Design
- **`api/`**: GraphQL client (`client.ts`), typed query wrappers (`queries/`), auth helpers (`auth.ts`), type definitions (`types.ts`), file upload (`upload.ts`) — see [api/CODEMAP.md](api/CODEMAP.md)
- **`components/`**: UI components organized by domain: `charts/` (D3/LayerCake radar/bar), `feed/`, `layout/` (nav, sidebar), `ui/` (buttons, modals, forms) — see [components/CODEMAP.md](components/CODEMAP.md)
- **`stores/`**: Svelte reactive stores — `notifications.svelte.ts` (in-app), `push.svelte.ts` (Firebase FCM), `toasts.svelte.ts` (UI feedback)
- **`utils/`**: Pure helpers — `constants.ts` (skill categories, grade ranges), `grade.ts` (display names), `helpers.ts` (date/string formatters)
- **`firebase.ts`**: Firebase SDK init for push notifications (FCM)

## Flow
Pages import from `$lib` → API client fetches GraphQL → typed response → Svelte reactive stores update → components re-render.

## Integration
- **Consumed by**: all `routes/` pages and layouts
- **Depends on**: Rails GraphQL API (via `routes/api/graphql/` proxy), Firebase (push notifications)
