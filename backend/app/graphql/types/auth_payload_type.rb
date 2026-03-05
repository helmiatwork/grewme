# frozen_string_literal: true

module Types
  class AuthPayloadType < Types::BaseObject
    field :access_token, String
    field :refresh_token, String
    field :expires_in, Integer
    field :user, Types::UserUnion
    field :errors, [ Types::UserErrorType ], null: false
  end
end
