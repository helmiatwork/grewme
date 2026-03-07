# frozen_string_literal: true

module Types
  class GrantConsentInputType < Types::BaseInputObject
    argument :token, String, required: true
    argument :name, String, required: true
    argument :password, String, required: true
    argument :password_confirmation, String, required: true
  end
end
