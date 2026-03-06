# frozen_string_literal: true

module Mutations
  class CreateLearningObjective < BaseMutation
    argument :input, Types::CreateLearningObjectiveInputType, required: true

    field :learning_objective, Types::LearningObjectiveType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless LearningObjectivePolicy.new(current_user, LearningObjective.new).create?

      learning_objective = LearningObjective.new(input.to_h)
      if learning_objective.save
        { learning_objective: learning_objective, errors: [] }
      else
        { learning_objective: nil, errors: learning_objective.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
