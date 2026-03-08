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
        AuditLogger.log(
          event_type: :SCORE_UPDATE,
          action: "update_daily_score",
          user: current_user,
          resource: daily_score,
          request: context[:request]
        )
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
