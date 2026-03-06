# frozen_string_literal: true

module Mutations
  class BulkCreateDailyScores < BaseMutation
    argument :classroom_id, ID, required: true
    argument :date, GraphQL::Types::ISO8601Date, required: true
    argument :skill_category, Types::SkillCategoryEnum, required: true
    argument :scores, [ Types::BulkScoreInputType ], required: true

    field :daily_scores, [ Types::DailyScoreType ], null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(classroom_id:, date:, skill_category:, scores:)
      authenticate!

      classroom = Classroom.find(classroom_id)
      raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).show?

      created = []
      all_errors = []

      scores.each do |score_input|
        student = Student.find(score_input.student_id)
        raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?

        daily_score = DailyScore.find_or_initialize_by(
          student_id: score_input.student_id,
          date: date,
          skill_category: skill_category
        )
        daily_score.score = score_input.score
        daily_score.teacher = current_user

        raise Pundit::NotAuthorizedError unless DailyScorePolicy.new(current_user, daily_score).create?

        if daily_score.save
          created << daily_score
        else
          daily_score.errors.each do |e|
            all_errors << { message: "#{student.name}: #{e.full_message}", path: [ score_input.student_id ] }
          end
        end
      end

      { daily_scores: created, errors: all_errors }
    end
  end
end
