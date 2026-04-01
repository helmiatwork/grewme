# front-end/src/routes/

## Responsibility
76 SvelteKit page routes organized by user role. Each subdirectory is a URL segment. Server-side data loading, auth guards, and API proxy endpoints all live here.

## Design
| Route group | Who uses it | Key screens |
|-------------|-------------|-------------|
| `login/`, `register/`, `consent/[token]/`, `invite/[token]/` | All users | Auth flows, COPPA consent |
| `parent/` | Parents | Dashboard, children detail, behavior, exams, curriculum, messages, calendar |
| `teacher/` | Teachers | Dashboard, classrooms, behavior input, exams, attendance, students, messages |
| `school/` | School managers | Behavior categories, classrooms, teachers, curriculum, settings, reports |
| `admin/` | AdminUser | Permission management |
| `api/` | Server-side | Auth endpoints, GraphQL proxy, file upload proxy |
| `exam/[code]/` | Students | Exam taking interface |
| `posts/[id]/` | All users | Feed post detail |

## Flow
1. User navigates → route's `+layout.server.ts` checks JWT cookie
2. Unauthorized → redirect to `/login`
3. Authorized → `+page.server.ts` runs GraphQL query server-side
4. Data passed to `+page.svelte` as `data` prop

## Integration
- **Auth guard**: `+layout.server.ts` at each role group enforces user type
- **API proxy**: `api/graphql/` forwards requests to Rails `POST /graphql`
- **Components**: all pages import from `$lib/components/`
