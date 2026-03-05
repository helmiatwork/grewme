# frozen_string_literal: true

module Types
  class PermissionType < Types::BaseObject
    field :id, ID, null: false
    field :resource, String, null: false
    field :action, String, null: false
    field :granted, Boolean, null: false
  end
end
