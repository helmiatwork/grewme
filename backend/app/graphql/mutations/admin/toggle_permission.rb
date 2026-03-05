# frozen_string_literal: true

module Mutations
  module Admin
    class TogglePermission < BaseMutation
      argument :id, ID, required: true

      field :permission, Types::PermissionType
      field :errors, [ Types::UserErrorType ], null: false

      def resolve(id:)
        authenticate!

        permission = Permission.find(id)
        raise Pundit::NotAuthorizedError unless PermissionPolicy.new(current_user, permission).update?

        if permission.update(granted: !permission.granted)
          { permission: permission, errors: [] }
        else
          {
            permission: nil,
            errors: permission.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
          }
        end
      end
    end
  end
end
