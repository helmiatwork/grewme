# frozen_string_literal: true

module Types
  class UserPermissionsType < Types::BaseObject
    field :user_id, ID, null: false
    field :role, String, null: false
    field :overrides, [ Types::PermissionType ], null: false
    field :effective, [ Types::EffectivePermissionType ], null: false
  end
end
