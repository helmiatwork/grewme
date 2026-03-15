# GrewMe Frontend — Codemap Index

**Complete mapping of the SvelteKit frontend codebase for documentation and navigation.**

---

## 📋 Codemap Files

### Root Codemap
- **[`CODEMAP.md`](./CODEMAP.md)** — Complete frontend overview
  - Project purpose, architecture, entry points
  - Directory structure & responsibilities
  - Design patterns & data flow
  - Key dependencies & integration points
  - Development workflow

### Core Layer Codemaps

#### API & Data Layer
- **[`src/lib/api/CODEMAP.md`](./src/lib/api/CODEMAP.md)** — GraphQL client, auth, types
  - `client.ts` — GraphQL fetch wrapper
  - `auth.ts` — JWT/cookie management
  - `types.ts` — TypeScript interfaces (466 lines)
  - `queries/` — Organized GraphQL queries by feature
  - Data flow examples

#### State Management
- **`src/lib/stores/CODEMAP.md`** (planned)
  - `notifications.svelte.ts` — Real-time notifications via ActionCable
  - `toasts.svelte.ts` — Toast notifications
  - `push.svelte.ts` — Push notifications

#### Components
- **[`src/lib/components/CODEMAP.md`](./src/lib/components/CODEMAP.md)** — Reusable UI components
  - Layout: AppShell, Navbar, Sidebar
  - UI: Button, Card, Input, Alert, Badge, Toast, Skeleton
  - Charts: RadarChart, ProgressChart, AxisRadial, RadarArea
  - Feed: FeedCard, CommentSection, FilePicker, MediaGallery

#### Utilities
- **`src/lib/utils/CODEMAP.md`** (planned)
  - `constants.ts` — Skill categories, colors, labels, emojis
  - `helpers.ts` — Date formatting, string utilities
  - `grade.ts` — Grade/score calculations

#### Internationalization
- **`src/lib/paraglide/CODEMAP.md`** (planned)
  - Paraglide i18n setup
  - Message organization
  - Language switching

### Route Layer Codemaps

#### Teacher Routes
- **[`src/routes/teacher/CODEMAP.md`](./src/routes/teacher/CODEMAP.md)** — Teacher dashboard & features
  - Dashboard, classrooms, students, curriculum
  - Exams (create, assign, grade)
  - Attendance, calendar, feed, messages
  - Leave requests, profile, settings

#### Parent Routes
- **`src/routes/parent/CODEMAP.md`** (planned)
  - Dashboard, children, curriculum
  - Calendar, messages, leave requests
  - Data rights, profile

#### School Manager Routes
- **`src/routes/school/CODEMAP.md`** (planned)
  - Dashboard, students, teachers, classrooms
  - Curriculum, exams, attendance, calendar
  - Settings, academic years

#### Admin Routes
- **`src/routes/admin/CODEMAP.md`** (planned)
  - Permissions management

#### Public Routes
- **`src/routes/public/CODEMAP.md`** (planned)
  - Login, register, consent, invite
  - Exam access, posts, privacy, terms

#### API Routes
- **`src/routes/api/CODEMAP.md`** (planned)
  - Auth endpoints (login, logout, refresh, register)
  - GraphQL proxy
  - File upload

---

## 🗂️ Directory Mapping

### Source Structure
```
src/
├── routes/                    — SvelteKit routes (61 pages, 57 server loads)
│   ├── teacher/              → [CODEMAP.md](./src/routes/teacher/CODEMAP.md)
│   ├── parent/               → [CODEMAP.md](./src/routes/parent/CODEMAP.md) (planned)
│   ├── school/               → [CODEMAP.md](./src/routes/school/CODEMAP.md) (planned)
│   ├── admin/                → [CODEMAP.md](./src/routes/admin/CODEMAP.md) (planned)
│   ├── api/                  → [CODEMAP.md](./src/routes/api/CODEMAP.md) (planned)
│   ├── login/                — Login form
│   ├── register/             — Registration form
│   ├── consent/              — Consent acceptance
│   ├── invite/               — Invitation acceptance
│   ├── exam/                 — Public exam access
│   ├── posts/                — Public post view
│   ├── privacy/              — Privacy policy
│   ├── terms/                — Terms of service
│   ├── +layout.svelte        — Root layout
│   ├── +layout.server.ts     — Root layout load
│   └── +page.svelte          — Root page (redirect logic)
│
├── lib/
│   ├── api/                  → [CODEMAP.md](./src/lib/api/CODEMAP.md)
│   │   ├── client.ts         — GraphQL fetch wrapper
│   │   ├── auth.ts           — JWT/cookie utilities
│   │   ├── types.ts          — TypeScript interfaces
│   │   ├── upload.ts         — File upload utilities
│   │   └── queries/          — GraphQL queries by feature
│   │
│   ├── stores/               → [CODEMAP.md](./src/lib/stores/CODEMAP.md) (planned)
│   │   ├── notifications.svelte.ts — Real-time notifications
│   │   ├── toasts.svelte.ts  — Toast notifications
│   │   └── push.svelte.ts    — Push notifications
│   │
│   ├── components/           → [CODEMAP.md](./src/lib/components/CODEMAP.md)
│   │   ├── layout/           — AppShell, Navbar, Sidebar
│   │   ├── ui/               — Button, Card, Input, Alert, Badge, Toast, Skeleton
│   │   ├── charts/           — RadarChart, ProgressChart, _radar/
│   │   └── feed/             — FeedCard, CommentSection, FilePicker, MediaGallery
│   │
│   ├── utils/                → [CODEMAP.md](./src/lib/utils/CODEMAP.md) (planned)
│   │   ├── constants.ts      — Skill constants
│   │   ├── helpers.ts        — Utility functions
│   │   └── grade.ts          — Grade calculations
│   │
│   ├── paraglide/            → [CODEMAP.md](./src/lib/paraglide/CODEMAP.md) (planned)
│   │   ├── messages.js       — Exported message functions
│   │   ├── runtime.js        — Paraglide runtime
│   │   ├── server.js         — Server middleware
│   │   └── messages/         — Message definitions
│   │
│   └── assets/               — Static assets
│
├── hooks.server.ts           — Server middleware (auth, locale, route guards)
├── app.css                   — Global styles
├── +layout.svelte            — Root layout
└── +page.svelte              — Root page

Configuration Files:
├── svelte.config.js          — SvelteKit + Vercel adapter
├── vite.config.ts            — Vite + Tailwind + Paraglide plugins
├── tsconfig.json             — TypeScript config
├── package.json              — Dependencies
└── project.inlang/           — Paraglide i18n config
```

---

## 🎯 Quick Navigation

### By Role
- **Teacher**: [src/routes/teacher/CODEMAP.md](./src/routes/teacher/CODEMAP.md)
- **Parent**: [src/routes/parent/CODEMAP.md](./src/routes/parent/CODEMAP.md) (planned)
- **School Manager**: [src/routes/school/CODEMAP.md](./src/routes/school/CODEMAP.md) (planned)

### By Feature
- **Authentication**: [src/lib/api/CODEMAP.md](./src/lib/api/CODEMAP.md) (auth.ts, auth queries)
- **Skill Radar**: [src/lib/components/CODEMAP.md](./src/lib/components/CODEMAP.md) (RadarChart)
- **Progress Tracking**: [src/lib/components/CODEMAP.md](./src/lib/components/CODEMAP.md) (ProgressChart)
- **Notifications**: [src/lib/stores/CODEMAP.md](./src/lib/stores/CODEMAP.md) (planned)
- **Feed Posts**: [src/lib/components/CODEMAP.md](./src/lib/components/CODEMAP.md) (FeedCard, etc.)
- **Exams**: [src/routes/teacher/CODEMAP.md](./src/routes/teacher/CODEMAP.md) (exams routes)

### By Layer
- **API Layer**: [src/lib/api/CODEMAP.md](./src/lib/api/CODEMAP.md)
- **State Layer**: [src/lib/stores/CODEMAP.md](./src/lib/stores/CODEMAP.md) (planned)
- **Component Layer**: [src/lib/components/CODEMAP.md](./src/lib/components/CODEMAP.md)
- **Route Layer**: [CODEMAP.md](./CODEMAP.md) (section 3)

---

## 📊 Statistics

### Code Organization
- **Total Routes**: 61 pages
- **Server Load Functions**: 57
- **Components**: 20+ reusable components
- **GraphQL Queries**: 18+ query files
- **TypeScript Interfaces**: 50+ types
- **Stores**: 3 reactive stores

### File Sizes
- `src/lib/api/types.ts`: 466 lines
- `src/lib/stores/notifications.svelte.ts`: 289 lines
- `src/lib/components/layout/Navbar.svelte`: 180 lines
- `src/lib/components/charts/ProgressChart.svelte`: 121 lines
- `src/hooks.server.ts`: 115 lines

### Dependencies
- **SvelteKit**: 2.50.2
- **Svelte**: 5.51.0
- **TypeScript**: 5.9.3
- **Tailwind CSS**: 4.2.1
- **Paraglide JS**: 2.13.2
- **D3**: 4.0.2 (scales), 3.2.0 (shapes)
- **LayerCake**: 10.0.2
- **ActionCable**: 8.1.200

---

## 🔄 Data Flow Overview

### Authentication Flow
```
Login Form → GraphQL LOGIN_MUTATION → setAuthCookies() → Redirect to Dashboard
                                                              ↓
                                                    hooks.server.ts checks token
                                                    decodeJwtPayload() → locals.user
```

### Page Load Flow
```
User navigates to /teacher/students/[id]
    ↓
hooks.server.ts: Check auth, role guard
    ↓
+layout.server.ts: Load user, accessToken, cableUrl
    ↓
+page.server.ts: Load STUDENT_RADAR_QUERY, STUDENT_PROGRESS_QUERY, STUDENT_DAILY_SCORES_QUERY
    ↓
+page.svelte: Render with data (RadarChart, ProgressChart, scores table)
```

### Real-time Notification Flow
```
Rails backend broadcasts notification
    ↓
ActionCable WebSocket → NotificationsChannel
    ↓
notifications.svelte.ts received() callback
    ↓
translateNotification() → Paraglide i18n
    ↓
addToast() → Show UI
    ↓
Navbar re-renders with unread count
```

---

## 🛠️ Development Workflow

### Setup
```bash
cd front-end
npm install
npm run dev  # Vite dev server on http://localhost:5173
```

### Type Checking
```bash
npm run check  # svelte-kit sync + svelte-check
npm run check:watch  # Watch mode
```

### Build & Deploy
```bash
npm run build  # SvelteKit + Vite build
npm run preview  # Preview production build
# Vercel auto-deploys on git push
```

---

## 📚 Related Documentation

- **Backend**: `/Users/theresiaputri/repo/grewme/backend` (Rails 8.1.2)
- **Kotlin Multiplatform**: `/Users/theresiaputri/repo/grewme/mobile` (Teacher + Parent apps)
- **Project Root**: `/Users/theresiaputri/repo/grewme`

---

## ✅ Codemap Completion Status

| Directory | Status | File |
|-----------|--------|------|
| Root | ✅ Complete | [CODEMAP.md](./CODEMAP.md) |
| `src/lib/api/` | ✅ Complete | [CODEMAP.md](./src/lib/api/CODEMAP.md) |
| `src/lib/components/` | ✅ Complete | [CODEMAP.md](./src/lib/components/CODEMAP.md) |
| `src/routes/teacher/` | ✅ Complete | [CODEMAP.md](./src/routes/teacher/CODEMAP.md) |
| `src/lib/stores/` | 📋 Planned | — |
| `src/lib/utils/` | 📋 Planned | — |
| `src/lib/paraglide/` | 📋 Planned | — |
| `src/routes/parent/` | 📋 Planned | — |
| `src/routes/school/` | 📋 Planned | — |
| `src/routes/admin/` | 📋 Planned | — |
| `src/routes/api/` | 📋 Planned | — |

---

## 🎓 How to Use This Index

1. **Start with [CODEMAP.md](./CODEMAP.md)** for overall architecture
2. **Navigate to specific layer codemaps** for detailed information:
   - API layer: [src/lib/api/CODEMAP.md](./src/lib/api/CODEMAP.md)
   - Components: [src/lib/components/CODEMAP.md](./src/lib/components/CODEMAP.md)
   - Routes: [src/routes/teacher/CODEMAP.md](./src/routes/teacher/CODEMAP.md)
3. **Use Quick Navigation** to jump to specific features
4. **Reference Data Flow** sections for understanding how data moves through the app
5. **Check Statistics** for project scope and complexity

---

**Last Updated**: March 15, 2026  
**Maintainer**: GrewMe Team  
**Status**: 4/11 codemaps complete, 7 planned
