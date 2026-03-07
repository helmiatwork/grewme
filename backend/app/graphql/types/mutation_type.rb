# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    # Auth
    field :login, mutation: Mutations::Login
    field :register, mutation: Mutations::Register
    field :refresh_token, mutation: Mutations::RefreshToken
    field :logout, mutation: Mutations::Logout

    # Uploads
    field :create_direct_upload, mutation: Mutations::CreateDirectUpload

    # Daily Scores
    field :create_daily_score, mutation: Mutations::CreateDailyScore
    field :update_daily_score, mutation: Mutations::UpdateDailyScore
    field :bulk_create_daily_scores, mutation: Mutations::BulkCreateDailyScores

    # Feed
    field :create_feed_post, mutation: Mutations::CreateFeedPost
    field :delete_feed_post, mutation: Mutations::DeleteFeedPost
    field :like_feed_post, mutation: Mutations::LikeFeedPost
    field :comment_on_feed_post, mutation: Mutations::CommentOnFeedPost
    field :delete_feed_comment, mutation: Mutations::DeleteFeedComment

    # Notifications
    field :mark_notification_read, mutation: Mutations::MarkNotificationRead

    # Push Devices
    field :register_push_device, mutation: Mutations::RegisterPushDevice
    field :unregister_push_device, mutation: Mutations::UnregisterPushDevice

    # Calendar
    field :create_classroom_event, mutation: Mutations::CreateClassroomEvent
    field :delete_classroom_event, mutation: Mutations::DeleteClassroomEvent

    # Chat
    field :create_conversation, mutation: Mutations::CreateConversation
    field :send_message, mutation: Mutations::SendMessage
    field :mark_messages_read, mutation: Mutations::MarkMessagesRead
    field :create_group_conversation, mutation: Mutations::CreateGroupConversation
    field :send_group_message, mutation: Mutations::SendGroupMessage

    # Admin Permissions
    field :grant_permission, mutation: Mutations::Admin::GrantPermission
    field :revoke_permission, mutation: Mutations::Admin::RevokePermission
    field :toggle_permission, mutation: Mutations::Admin::TogglePermission
    field :delete_permission, mutation: Mutations::Admin::DeletePermission

    # Invitations
    field :create_invitation, mutation: Mutations::CreateInvitation
    field :accept_invitation, mutation: Mutations::AcceptInvitation
    field :revoke_invitation, mutation: Mutations::RevokeInvitation

    # School Management
    field :assign_teacher_to_classroom, mutation: Mutations::AssignTeacherToClassroom
    field :remove_teacher_from_classroom, mutation: Mutations::RemoveTeacherFromClassroom
    field :transfer_student, mutation: Mutations::TransferStudent

    # Profile
    field :update_profile, mutation: Mutations::UpdateProfile
    field :change_password, mutation: Mutations::ChangePassword

    # Curriculum
    field :create_subject, mutation: Mutations::CreateSubject
    field :update_subject, mutation: Mutations::UpdateSubject
    field :delete_subject, mutation: Mutations::DeleteSubject
    field :create_topic, mutation: Mutations::CreateTopic
    field :update_topic, mutation: Mutations::UpdateTopic
    field :delete_topic, mutation: Mutations::DeleteTopic
    field :create_learning_objective, mutation: Mutations::CreateLearningObjective
    field :update_learning_objective, mutation: Mutations::UpdateLearningObjective
    field :delete_learning_objective, mutation: Mutations::DeleteLearningObjective

    # Yearly Curriculum
    field :create_academic_year, mutation: Mutations::CreateAcademicYear
    field :update_academic_year, mutation: Mutations::UpdateAcademicYear
    field :set_current_academic_year, mutation: Mutations::SetCurrentAcademicYear
    field :save_grade_curriculum, mutation: Mutations::SaveGradeCurriculum

    # Consent
    field :request_consent, mutation: Mutations::RequestConsent
    field :grant_consent, mutation: Mutations::GrantConsent
    field :decline_consent, mutation: Mutations::DeclineConsent
    field :revoke_consent, mutation: Mutations::RevokeConsent

    # Exams
    field :create_exam, mutation: Mutations::CreateExam
    field :assign_exam_to_classroom, mutation: Mutations::AssignExamToClassroom
    field :submit_exam_answers, mutation: Mutations::SubmitExamAnswers
    field :grade_exam_submission, mutation: Mutations::GradeExamSubmission
  end
end
