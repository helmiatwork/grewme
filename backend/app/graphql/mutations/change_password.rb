# frozen_string_literal: true

module Mutations
  class ChangePassword < BaseMutation
    argument :current_password, String, required: true
    argument :new_password, String, required: true
    argument :new_password_confirmation, String, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(current_password:, new_password:, new_password_confirmation:)
      authenticate!

      unless current_user.valid_password?(current_password)
        return { success: false, errors: [ { message: "Current password is incorrect", path: [ "currentPassword" ] } ] }
      end

      if current_user.update(password: new_password, password_confirmation: new_password_confirmation)
        { success: true, errors: [] }
      else
        {
          success: false,
          errors: current_user.errors.map { |e|
            { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] }
          }
        }
      end
    end
  end
end
