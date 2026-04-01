# SvelteKit Web Frontend

## Responsibility
Web application serving teachers, parents, and school admins. Provides dashboards, curriculum tracking, behavior monitoring, exam grading, calendar management, and real-time messaging. Consumes GraphQL API from Rails backend.

## Design
- **Framework**: SvelteKit 2.50.2 with TypeScript
- **Styling**: Tailwind CSS 4.2.1 + Tailwind Vite plugin
- **Charts**: D3 scales and shapes with LayerCake for radar charts, bar charts
- **Auth**: JWT tokens via custom API routes, Firebase auth integration
- **Real-time**: ActionCable for WebSocket communication
- **I18n**: Paraglide-JS for multi-language support
- **State**: Svelte stores (push notifications, toast notifications, theme)
- **Utilities**: Spark-MD5 for checksums, emoji-picker-element for reactions, svelte-dnd-action for drag-and-drop

## Key Files
```
front-end/
├── package.json          # SvelteKit 2.50.2, Tailwind 4.2.1, Firebase 12.10.0
├── svelte.config.js      # Auto adapter + Vercel deployment
├── tailwind.config.js    # Tailwind configuration
├── src/
│   ├── app.html          # Root HTML template
│   ├── routes/           # 76 SvelteKit pages (auth, exam, admin, parent, school, teacher)
│   └── lib/              # Shared components, utils, stores
```

## Integration
- **Backend**: GraphQL API at `/graphql` (Rails)
- **Auth**: `/routes/api/auth/` endpoints (login, logout, register, refresh)
- **Upload**: `/routes/api/upload/` for file handling
- **Deployment**: Vercel adapter configured
