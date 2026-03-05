# frozen_string_literal: true

module Mutations
  class UpdateDailyScore < BaseMutation
    argument :id, ID, required: true
    argument :input, Types::UpdateDailyScoreInputType, required: true

    field :daily_score, Types::DailyScoreType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, input:)
      authenticate!

      daily_score = DailyScore.find(id)
      raise Pundit::NotAuthorizedError unless DailyScorePolicy.new(current_user, daily_score).update?

      if daily_score.update(input.to_h.compact)
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
