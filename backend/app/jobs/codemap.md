# app/jobs/

## Responsibility
Background jobs processed by Solid Queue (PostgreSQL-backed). Handles async operations: mastery evaluation, radar chart refresh, push notifications, consent lifecycle, exam auto-submit, and data retention cleanup.

## Design
- **ApplicationJob** base class with Solid Queue adapter
- **limits_concurrency**: Prevents race conditions (e.g., one radar refresh per student at a time)
- **retry_on**: Handles deadlocks with automatic retry (ActiveRecord::Deadlocked)
- **queue_as**: Priority routing — `:default` for time-sensitive, `:low` for maintenance

### Jobs:
- **EvaluateMasteryJob**: Evaluates all objectives in a topic for a student after exam submission. Calls MasteryEvaluationService.
- **RefreshRadarSummaryJob**: Recalculates StudentRadarSummary materialized data after daily score changes. Concurrency-limited per student.
- **SendPushNotificationJob**: Sends Firebase Cloud Messaging push to user's registered PushDevices.
- **ConsentExpiryJob**: Marks consent as expired after TTL. Scheduled on consent creation.
- **ConsentReminderJob**: Sends reminder email before consent expires.
- **ExamAutoSubmitJob**: Auto-submits exam after duration expires (Kahoot-style timed exams).
- **DataRetentionCleanupJob**: Periodic cleanup of expired data per retention policy.

## Flow
1. Mutation/callback enqueues job → Solid Queue persists to PostgreSQL
2. Worker picks up job → executes `perform` method
3. Job calls services or updates models directly
4. On failure: retry (deadlock) or log error (Sentry)

## Integration
- **Triggered by**: DailyScore after_save → RefreshRadarSummaryJob
- **Triggered by**: ExamSubmission creation → EvaluateMasteryJob
- **Triggered by**: Consent creation → ConsentExpiryJob + ConsentReminderJob
- **Triggered by**: NotificationService → SendPushNotificationJob
- **Triggered by**: Exam start → ExamAutoSubmitJob (delayed)
- **Depends on**: MasteryEvaluationService, NotificationService, Firebase SDK
