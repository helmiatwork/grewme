# db/

## Responsibility
Database layer: schema definition (40+ tables), migrations, seeds, and Scenic database views for complex aggregations.

## Design
- **schema.rb**: Current database state — 40+ tables with indexes, constraints, foreign keys
- **migrate/**: Sequential migration files for schema evolution. Uses StrongMigrations for safety.
- **seeds/**: Development seed data for all models
- **views/**: Scenic SQL views (e.g., student_radar_summaries materialized view)

### Key Tables:
- Users: `teachers`, `parents`, `school_managers`, `admin_users`
- School: `schools`, `classrooms`, `classroom_teachers`, `classroom_students`
- Curriculum: `subjects`, `topics`, `learning_objectives`, `grade_curricula`
- Assessment: `daily_scores`, `exams`, `exam_questions`, `exam_submissions`, `exam_answers`, `objective_masteries`, `student_radar_summaries`
- Communication: `feed_posts`, `feed_comments`, `feed_likes`, `conversations`, `messages`, `notifications`, `push_devices`
- Compliance: `consents`, `invitations`, `audit_logs`, `account_deletion_requests`

## Flow
Migration runs → Schema updated → Models reflect new schema → Seeds populate dev data

## Integration
- **Models**: Map 1:1 to database tables
- **Scenic views**: Materialized views refreshed by background jobs
- **PaperTrail**: `versions` table tracks all model changes
