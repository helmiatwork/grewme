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

    # School Management
    field :assign_teacher_to_classroom, mutation: Mutations::AssignTeacherToClassroom
    field :remove_teacher_from_classroom, mutation: Mutations::RemoveTeacherFromClassroom
    field :transfer_student, mutation: Mutations::TransferStudent

    # Profile
    field :update_profile, mutation: Mutations::UpdateProfile
    field :change_password, mutation: Mutations::ChangePassword
  end
end
