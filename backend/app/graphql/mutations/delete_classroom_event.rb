# frozen_string_literal: true

module Mutations
  class DeleteClassroomEvent < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      authenticate!

      event = ClassroomEvent.find(id)
      raise Pundit::NotAuthorizedError unless ClassroomEventPolicy.new(current_user, event).destroy?

      event.destroy!
      { success: true, errors: [] }
    end
  end
end
