# frozen_string_literal: true

module Types
  class EffectivePermissionType < Types::BaseObject
    field :resource, String, null: false
    field :action, String, null: false
    field :granted, Boolean, null: false
    field :source, String, null: false, description: "role_default or override"
  end
end
