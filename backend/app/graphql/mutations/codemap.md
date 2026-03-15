# app/graphql/mutations/

## Responsibility
40 GraphQL mutations handling all write operations: authentication (login, register, refresh_token, logout), curriculum management (CRUD for subjects, topics, objectives), assessment (daily scores, exam submissions, grading), communication (feed posts, messages, notifications), compliance (consent, invitations, account deletion), and health (checkups).

## Design
- **BaseMutation**: All mutations inherit from this. Provides:
  - `authenticate!` — raises error if no current_user
  - `authorize!(record, action)` — Pundit policy check
  - `current_user` — from context
  - Consistent error response via `UserErrorType`
- **Input types**: Complex arguments use dedicated InputType classes
- **Audit logging**: Every mutation calls `AuditLogger.log` for COPPA compliance
- **Background jobs**: Mutations schedule async work (EvaluateMasteryJob, RefreshRadarSummaryJob, etc.)
- **Transaction safety**: Multi-step operations wrapped in `ActiveRecord::Base.transaction`

### Mutation Categories:
- **Auth**: Login, Register, RefreshToken, Logout, AcceptInvitation
- **Curriculum**: CreateSubject, CreateTopic, CreateLearningObjective, CreateGradeCurriculum
- **Assessment**: CreateDailyScore, BulkCreateDailyScores, CreateExam, SubmitExamAnswers, GradeSubmission
- **Communication**: CreateFeedPost, CreateComment, ToggleLike, SendMessage, SendGroupMessage
- **Compliance**: RequestConsent, VerifyConsent, CreateInvitation, RequestAccountDeletion, ExportData
- **Health**: CreateHealthCheckup
- **Attendance**: RecordAttendance, BulkRecordAttendance
- **Leave**: CreateLeaveRequest, ApproveLeaveRequest, RejectLeaveRequest

## Flow
1. Mutation receives input arguments
2. `authenticate!` — verify JWT token present
3. `authorize!(record, :create?)` — Pundit policy check
4. Validate input (custom validations + model validations)
5. Create/update records in database
6. `AuditLogger.log(action, record, user)` — compliance
7. Schedule background jobs if needed
8. Return `{ record:, errors: }` response

## Integration
- **Inherits**: BaseMutation (auth + authorization helpers)
- **Calls**: Services (MasteryEvaluation, Notification, AuditLogger)
- **Calls**: Models (ActiveRecord CRUD)
- **Schedules**: Jobs (EvaluateMasteryJob, RefreshRadarSummaryJob, SendPushNotificationJob)
- **Uses**: Pundit policies for authorization
- **Returns**: GraphQL types for response serialization
