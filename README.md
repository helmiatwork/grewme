# GrewMe

Making children's learning progress visible and actionable.

GrewMe is a school management platform that gives teachers and parents real-time visibility into student progress through a five-skill radar visualization. It combines daily assessments, exams, curriculum tracking, behavior points, health monitoring, attendance, and messaging across web and mobile apps, powered by a GraphQL Rails API.

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Backend** | Rails 8.1 / PostgreSQL / GraphQL 2.5 / Devise JWT / Pundit / Solid Queue + Cache + Cable |
| **Frontend** | SvelteKit 2.50 / Svelte 5 / TypeScript 5.9 / Tailwind CSS 4 / Paraglide (i18n) |
| **Mobile** | Expo 54 / React Native 0.81 / Apollo Client 3 / Zustand 5 / GraphQL Codegen |
| **Deploy** | Kamal 2.10 (backend) / Vercel (frontend) / EAS Build (mobile) |

## Project Structure

```
grewme/
├── backend/          Rails GraphQL API (70+ tables, 60+ mutations, 22 policies)
├── front-end/        SvelteKit web app (76 pages, teacher/parent/school roles)
├── mobile/           React Native Expo app (51 screens, teacher/parent roles)
└── docker-compose.yml  MinIO for local S3-compatible storage
```

## Features

### Assessment & Progress
- **Skill Radar** -- five fixed categories (Reading, Math, Writing, Logic, Social), 0-100 scale
- **Daily Scores** -- individual and bulk entry by teachers, aggregated into radar view
- **Exams** -- score-based, multiple-choice, rubric, pass/fail types
- **Kahoot-style Access** -- students take exams via unauthenticated access code
- **Mastery Tracking** -- learning objective mastery via daily scores and exams

### Curriculum
- Subjects > Topics > Learning Objectives hierarchy
- Grade-level curriculum plans tied to academic years
- Drag-and-drop objective ordering

### Behavior & Health
- Customizable behavior categories per school (positive/negative points)
- 15-minute revoke window for corrections
- Health checkups (weight, height, head circumference, auto-BMI)

### Communication
- 1-to-1 teacher-parent conversations (real-time via ActionCable)
- Group classroom conversations
- Social feed with media, student tags, likes, comments
- Push notifications (Firebase Cloud Messaging)
- Calendar events per classroom

### Attendance & Leave
- Daily attendance recording per classroom
- Parent leave request submission with teacher review
- Teacher leave balance tracking with school manager approval

### COPPA Compliance
- Invitation-only registration (no public signup)
- Parental consent workflow (email_plus or school_official)
- Data export and account deletion requests
- Audit logging for sensitive data access

### Roles

| Role | Scope |
|------|-------|
| **Teacher** | Dashboard, scoring, exams, behavior, attendance, feed, messaging, calendar, leave review |
| **Parent** | Children overview, progress tracking, messaging, leave requests, data rights |
| **School Manager** | School-wide admin, teacher management, curriculum oversight, leave settings |
| **Admin** | Permission management via Avo admin panel |

## Getting Started

### Prerequisites

- Ruby 3.3+, Node.js 20+, PostgreSQL 15+

### Backend

```bash
cd backend
bundle install
rails db:create db:migrate db:seed
./bin/dev
```

GraphQL endpoint: `http://localhost:3000/graphql`

### Frontend

```bash
cd front-end
npm install
npm run dev
```

Web app: `http://localhost:5173`

### Mobile

```bash
cd mobile
npm install
npm run codegen    # generate GraphQL types
npm start          # Expo dev server
```

### Local S3 (MinIO)

```bash
docker compose up -d
```

MinIO console: `http://localhost:9001` (minioadmin/minioadmin)

## Testing

```bash
# Backend
cd backend && bundle exec rspec

# Frontend
cd front-end && npm run check

# Mobile
cd mobile && npx jest --no-coverage
```

## API

Single GraphQL endpoint (`POST /graphql`) with JWT authentication.

- **Auth**: `Authorization: Bearer <token>` header
- **Real-time**: ActionCable WebSockets for messaging and notifications
- **Schema**: `backend/app/graphql/types/query_type.rb` (queries), `mutation_type.rb` (60+ mutations)

## Database

73 tables across domains: users (4 types), classrooms, students, daily scores, exams, curriculum, behavior, health, messaging, feed, attendance, leave, consents, audit logs, and Solid Stack infrastructure tables. Includes materialized view `student_radar_summaries` for aggregated skill scores.

## Deploy

```bash
# Backend (Kamal)
cd backend && kamal deploy

# Frontend (Vercel)
git push  # auto-deploys on main

# Mobile (EAS)
cd mobile && eas build --platform all
```
