# frozen_string_literal: true

module Mutations
  class UpdateLearningObjective < BaseMutation
    argument :input, Types::UpdateLearningObjectiveInputType, required: true

    field :learning_objective, Types::LearningObjectiveType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      learning_objective = LearningObjective.find(input.id)
      raise Pundit::NotAuthorizedError unless LearningObjectivePolicy.new(current_user, learning_objective).update?

      if learning_objective.update(input.to_h.except(:id))
        { learning_objective: learning_objective, errors: [] }
      else
        { learning_objective: nil, errors: learning_objective.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
