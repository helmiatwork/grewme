# frozen_string_literal: true

module Types
  class SchoolManagerType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :phone, String
    field :bio, String
    field :birthdate, GraphQL::Types::ISO8601Date
    field :gender, String
    field :qualification, String
    field :address_line1, String
    field :address_line2, String
    field :city, String
    field :state_province, String
    field :postal_code, String
    field :country_code, String
    field :avatar_url, String
    field :school, Types::SchoolType, null: false

    def avatar_url
      if object.avatar_image.attached?
        Rails.application.routes.url_helpers.url_for(object.avatar_image)
      end
    end
  end
end
