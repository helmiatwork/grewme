# frozen_string_literal: true

module Mutations
  class MarkNotificationRead < BaseMutation
    argument :id, ID, required: true

    field :notification, Types::NotificationType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      authenticate!
      notification = Notification.find(id)

      unless notification.recipient == current_user
        raise Pundit::NotAuthorizedError
      end

      notification.mark_as_read!
      { notification: notification, errors: [] }
    end
  end
end
