# frozen_string_literal: true

module Types
  class RegisterInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :email, String, required: false, description: "Required only for invitation-based registration"
    argument :password, String, required: true
    argument :password_confirmation, String, required: true
    argument :role, String, required: false, description: "Deprecated: role is now determined by token type"
    argument :phone, String, required: false, description: "Required for parents"
    argument :invitation_token, String, required: false, description: "Token from teacher invitation email"
    argument :consent_token, String, required: false, description: "Token from parental consent email"
  end
end
