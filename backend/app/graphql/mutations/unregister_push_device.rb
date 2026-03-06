# frozen_string_literal: true

module Mutations
  class UnregisterPushDevice < BaseMutation
    argument :token, String, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(token:)
      authenticate!

      device = current_user.push_devices.find_by(token: token)
      if device
        device.deactivate!
        { success: true, errors: [] }
      else
        { success: true, errors: [] } # Idempotent — no error if not found
      end
    end
  end
end
