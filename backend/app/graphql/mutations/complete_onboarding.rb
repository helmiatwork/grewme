# frozen_string_literal: true

module Mutations
  class CompleteOnboarding < BaseMutation
    field :school, Types::SchoolType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve
      authenticate!

      unless current_user.school_manager?
        raise GraphQL::ExecutionError, "Only school managers can complete onboarding"
      end

      school = current_user.school
      school.update!(onboarding_completed_at: Time.current)

      { school: school, errors: [] }
    end
  end
end
