# frozen_string_literal: true

module Mutations
  class RegisterPushDevice < BaseMutation
    argument :token, String, required: true
    argument :platform, String, required: true

    field :push_device, Types::PushDeviceType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(token:, platform:)
      authenticate!

      device = PushDevice.find_or_initialize_by(token: token)
      device.assign_attributes(
        user: current_user,
        platform: platform,
        active: true,
        last_seen_at: Time.current
      )

      if device.save
        { push_device: device, errors: [] }
      else
        {
          push_device: nil,
          errors: device.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
