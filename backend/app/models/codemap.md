# app/models/

## Responsibility
54 ActiveRecord models representing the complete domain: Users (Teacher, Parent, SchoolManager, AdminUser), School hierarchy (School, Classroom, ClassroomTeacher, ClassroomStudent), Curriculum (Subject, Topic, LearningObjective, GradeCurriculum, GradeCurriculumObjective), Assessment (DailyScore, Exam, ExamQuestion, ExamSubmission, ExamAnswer, ObjectiveMastery, RubricScore, StudentRadarSummary), Communication (FeedPost, FeedComment, FeedLike, Conversation, Message, GroupConversation, GroupMessage, Notification, PushDevice), Health (HealthCheckup), Attendance (Attendance), Leave (LeaveRequest, LeaveBalance), and Compliance (Consent, Invitation, AuditLog, AccountDeletionRequest, DataExport).

## Design
- **Polymorphic associations**: `created_by`, `recipient`, `user` fields accept multiple user types
- **Concerns**: `Permissionable` (role-based permission checks), `AccessCodeGenerator` (unique codes for exams)
- **Activity tracking**: `PublicActivity::Model` included on key models for audit feed
- **Encryption at rest**: Lockbox encrypts `name`, `email` on Student, Parent, Teacher; BlindIndex for searchable encrypted fields
- **Enums**: `skill_category` (reading/math/writing/logic/social), `exam_type` (score_based/multiple_choice/rubric/pass_fail), `attendance_status`, `leave_type`
- **Scopes**: `current`, `mastered`, `for_student`, `for_classroom` for filtered queries
- **Callbacks**: Cache invalidation on DailyScore save triggers `RefreshRadarSummaryJob`; ExamSubmission triggers `EvaluateMasteryJob`
- **Validations**: Strong presence/uniqueness/numericality constraints on all models

## Flow
1. GraphQL mutation creates/updates model
2. ActiveRecord validations run
3. Callbacks fire (cache invalidation, job scheduling)
4. PublicActivity records activity
5. PaperTrail creates version record
6. Background jobs process async work (mastery evaluation, radar refresh)

## Integration
- **Consumed by**: GraphQL types serialize models → API responses
- **Consumed by**: GraphQL mutations create/update models
- **Consumed by**: Pundit policies authorize access to models
- **Consumed by**: Avo admin panel for CRUD operations
- **Triggers**: Background jobs via Solid Queue
- **Triggers**: ActionCable broadcasts via NotificationService
