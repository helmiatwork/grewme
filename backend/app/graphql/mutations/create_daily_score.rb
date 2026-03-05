# frozen_string_literal: true

module Mutations
  class CreateDailyScore < BaseMutation
    argument :input, Types::CreateDailyScoreInputType, required: true

    field :daily_score, Types::DailyScoreType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!

      daily_score = DailyScore.new(input.to_h)
      daily_score.teacher = current_user

      student = Student.find(input.student_id)
      raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?
      raise Pundit::NotAuthorizedError unless DailyScorePolicy.new(current_user, daily_score).create?

      if daily_score.save
        { daily_score: daily_score, errors: [] }
      else
        {
          daily_score: nil,
          errors: daily_score.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
