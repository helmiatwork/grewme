# frozen_string_literal: true

module Mutations
  class SubmitExamSession < BaseMutation
    argument :input, Types::SubmitExamSessionInputType, required: true

    field :exam_submission, Types::ExamSubmissionType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      session_token = input.session_token
      submission = ExamSubmission.find_by(session_token: session_token)
      unless submission&.in_progress?
        return { exam_submission: nil, errors: [ { message: "Invalid or expired session", path: [ "sessionToken" ] } ] }
      end

      exam = submission.exam

      ActiveRecord::Base.transaction do
        submission.status = :submitted
        submission.submitted_at = Time.current
        submission.save!

        # Auto-grade MC exams
        if exam.multiple_choice?
          total_points = 0
          earned_points = 0

          submission.exam_answers.includes(:exam_question).each do |answer|
            question = answer.exam_question
            correct = question.correct_answer == answer.selected_answer
            points = correct ? question.points : 0

            answer.update!(correct: correct, points_awarded: points)

            total_points += question.points
            earned_points += points
          end

          submission.score = (total_points > 0) ? (earned_points.to_f / total_points * 100).round(2) : 0
          submission.passed = submission.score >= exam.topic&.learning_objectives&.first&.exam_pass_threshold.to_i
          submission.status = :graded
          submission.graded_at = Time.current
          submission.save!
        end
      end

      if exam.multiple_choice? && exam.topic
        EvaluateMasteryJob.perform_later(submission.student_id, exam.topic.id)
      end

      { exam_submission: submission, errors: [] }
    end
  end
end
