# frozen_string_literal: true

module Mutations
  module Admin
    class RevokePermission < BaseMutation
      argument :user_id, ID, required: true
      argument :user_type, String, required: true, description: "Teacher or Parent"
      argument :resource, String, required: true
      argument :action, String, required: true

      field :permission, Types::PermissionType
      field :errors, [ Types::UserErrorType ], null: false

      def resolve(user_id:, user_type:, resource:, action:)
        authenticate!
        raise Pundit::NotAuthorizedError unless PermissionPolicy.new(current_user, Permission).create?

        klass = user_type.safe_constantize
        raise GraphQL::ExecutionError, "Invalid user type" unless klass && [ Teacher, Parent ].include?(klass)
        target_user = klass.find(user_id)

        permission = target_user.permissions.build(resource: resource, action: action, granted: false)

        if permission.save
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
