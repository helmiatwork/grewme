# app/services/

## Responsibility
Service Object layer encapsulating complex business logic that spans multiple models or requires orchestration. Keeps mutations thin by extracting domain operations.

## Design
- **Service Object pattern**: Each service is a class with a class-level entry method (e.g., `self.evaluate`, `self.call`)
- **Single Responsibility**: One service per domain operation
- **Dependency injection**: Services receive models/params, not global state
- **Explicit returns**: Success/failure communicated via return values or exceptions

### Services:
- **MasteryEvaluationService**: Evaluates whether a student has mastered a learning objective based on exam scores and daily scores against configurable thresholds
- **NotificationService**: Creates Notification records, broadcasts via ActionCable, enqueues SendPushNotificationJob for Firebase Cloud Messaging
- **AuditLogger**: Records all significant events (data access, modifications, consent changes) to AuditLog for COPPA compliance
- **QuestionGenerator**: Generates parameterized exam questions with variable substitution
- **FormulaEvaluator**: Evaluates grade curriculum formulas using Dentaku gem for weighted score calculations

## Flow
1. GraphQL mutation or background job calls service
2. Service orchestrates model operations (queries, creates, updates)
3. Service may trigger secondary effects (notifications, audit logs, jobs)
4. Service returns result to caller

## Integration
- **Called by**: GraphQL mutations (CreateDailyScore, SubmitExamAnswers, etc.)
- **Called by**: Background jobs (EvaluateMasteryJob, RefreshRadarSummaryJob)
- **Calls**: ActiveRecord models, ActionCable broadcasts, Solid Queue jobs
- **AuditLogger**: Called by every mutation for COPPA compliance trail
