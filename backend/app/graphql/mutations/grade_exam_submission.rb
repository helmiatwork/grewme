# frozen_string_literal: true

module Mutations
  class GradeExamSubmission < BaseMutation
    argument :input, Types::GradeSubmissionInputType, required: true

    field :exam_submission, Types::ExamSubmissionType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      submission = ExamSubmission.find(input.exam_submission_id)
      raise Pundit::NotAuthorizedError unless ExamSubmissionPolicy.new(current_user, submission).update?

      ActiveRecord::Base.transaction do
        if input.rubric_scores.present?
          total_max = 0
          total_earned = 0

          input.rubric_scores.each do |rs_input|
            criteria = RubricCriteria.find(rs_input.rubric_criteria_id)
            submission.rubric_scores.create!(
              rubric_criteria: criteria,
              score: rs_input.score,
              feedback: rs_input.feedback
            )
            total_max += criteria.max_score
            total_earned += rs_input.score
          end

          submission.score = (total_max > 0) ? (total_earned.to_f / total_max * 100).round(2) : 0
        elsif input.score.present?
          submission.score = input.score
        end

        submission.passed = input.passed unless input.passed.nil?
        submission.teacher_notes = input.teacher_notes if input.teacher_notes.present?
        submission.status = :graded
        submission.graded_at = Time.current
        submission.save!
      end

      { exam_submission: submission, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { exam_submission: nil, errors: e.record.errors.map { |err| { message: err.full_message, path: [ err.attribute.to_s.camelize(:lower) ] } } }
    end
  end
end
