# frozen_string_literal: true

module Types
  class ConsentType < Types::BaseObject
    field :id, ID, null: false
    field :student_name, String
    field :parent_email, String, null: false
    field :status, String, null: false
    field :consent_method, String, null: false
    field :granted_at, GraphQL::Types::ISO8601DateTime
    field :revoked_at, GraphQL::Types::ISO8601DateTime
    field :expires_at, GraphQL::Types::ISO8601DateTime

    def student_name
      object.student&.name
    end
  end
end
