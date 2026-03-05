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

    # Feed
    field :create_feed_post, mutation: Mutations::CreateFeedPost
    field :delete_feed_post, mutation: Mutations::DeleteFeedPost
    field :like_feed_post, mutation: Mutations::LikeFeedPost
    field :comment_on_feed_post, mutation: Mutations::CommentOnFeedPost
    field :delete_feed_comment, mutation: Mutations::DeleteFeedComment

    # Admin Permissions
    field :grant_permission, mutation: Mutations::Admin::GrantPermission
    field :revoke_permission, mutation: Mutations::Admin::RevokePermission
    field :toggle_permission, mutation: Mutations::Admin::TogglePermission
    field :delete_permission, mutation: Mutations::Admin::DeletePermission
  end
end
