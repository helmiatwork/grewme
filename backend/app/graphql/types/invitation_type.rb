# frozen_string_literal: true

module Types
  class InvitationType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :status, String, null: false
    field :token, String, null: false
    field :expires_at, GraphQL::Types::ISO8601DateTime, null: false
    field :accepted_at, GraphQL::Types::ISO8601DateTime
    field :inviter_name, String

    def inviter_name
      object.inviter&.name
    end
  end
end
