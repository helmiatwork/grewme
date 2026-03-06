# frozen_string_literal: true

module Mutations
  class DeleteTopic < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      authenticate!
      topic = Topic.find(id)
      raise Pundit::NotAuthorizedError unless TopicPolicy.new(current_user, topic).destroy?

      topic.destroy!
      { success: true, errors: [] }
    end
  end
end
