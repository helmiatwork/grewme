# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    # Auth
    field :login, mutation: Mutations::Login
    field :register, mutation: Mutations::Register
    field :refresh_token, mutation: Mutations::RefreshToken
    field :logout, mutation: Mutations::Logout

    # Daily Scores
    field :create_daily_score, mutation: Mutations::CreateDailyScore
    field :update_daily_score, mutation: Mutations::UpdateDailyScore

    # Admin Permissions
    field :grant_permission, mutation: Mutations::Admin::GrantPermission
    field :revoke_permission, mutation: Mutations::Admin::RevokePermission
    field :toggle_permission, mutation: Mutations::Admin::TogglePermission
    field :delete_permission, mutation: Mutations::Admin::DeletePermission
  end
end
