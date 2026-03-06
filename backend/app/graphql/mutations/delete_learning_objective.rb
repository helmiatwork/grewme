# frozen_string_literal: true

module Mutations
  class DeleteLearningObjective < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      authenticate!
      learning_objective = LearningObjective.find(id)
      raise Pundit::NotAuthorizedError unless LearningObjectivePolicy.new(current_user, learning_objective).destroy?

      learning_objective.destroy!
      { success: true, errors: [] }
    end
  end
end
