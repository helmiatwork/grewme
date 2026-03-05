# frozen_string_literal: true

module Types
  class RegisterInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :email, String, required: true
    argument :password, String, required: true
    argument :password_confirmation, String, required: true
    argument :role, String, required: true, description: "teacher or parent"
    argument :phone, String, required: false, description: "Required for parents"
  end
end
