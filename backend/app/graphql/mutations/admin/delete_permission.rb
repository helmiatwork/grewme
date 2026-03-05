# frozen_string_literal: true

module Mutations
  module Admin
    class DeletePermission < BaseMutation
      argument :id, ID, required: true

      field :success, Boolean, null: false
      field :errors, [ Types::UserErrorType ], null: false

      def resolve(id:)
        authenticate!

        permission = Permission.find(id)
        raise Pundit::NotAuthorizedError unless PermissionPolicy.new(current_user, permission).destroy?

        permission.destroy!
        { success: true, errors: [] }
      end
    end
  end
end
