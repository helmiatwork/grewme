# frozen_string_literal: true

module Types
  class AuditLogType < Types::BaseObject
    field :id, ID, null: false
    field :event_type, String, null: false
    field :severity, String, null: false
    field :action, String, null: false
    field :user_type, String
    field :user_id, ID
    field :user_role, String
    field :resource_type, String
    field :resource_id, ID
    field :metadata, GraphQL::Types::JSON
    field :ip_address, String
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
