# frozen_string_literal: true

module Mutations
  class SubmitExamAnswers < BaseMutation
    argument :input, Types::SubmitAnswersInputType, required: true

    field :exam_submission, Types::ExamSubmissionType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      classroom_exam = ClassroomExam.find(input.classroom_exam_id)
      exam = classroom_exam.exam

      submission = ExamSubmission.find_or_initialize_by(
        student_id: context[:current_user].id,
        classroom_exam: classroom_exam
      )

      ActiveRecord::Base.transaction do
        submission.status = :submitted
        submission.submitted_at = Time.current
        submission.save!

        if exam.multiple_choice?
          total_points = 0
          earned_points = 0

          input.answers.each do |answer_input|
            question = exam.exam_questions.find(answer_input.exam_question_id)
            correct = question.correct_answer == answer_input.selected_answer
            points = correct ? question.points : 0

            submission.exam_answers.create!(
              exam_question: question,
              selected_answer: answer_input.selected_answer,
              correct: correct,
              points_awarded: points
            )

            total_points += question.points
            earned_points += points
          end

          submission.score = (total_points > 0) ? (earned_points.to_f / total_points * 100).round(2) : 0
          submission.passed = submission.score >= classroom_exam.exam.topic.learning_objectives.first&.exam_pass_threshold.to_i
          submission.status = :graded
          submission.graded_at = Time.current
          submission.save!
        end
      end

      { exam_submission: submission, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { exam_submission: nil, errors: e.record.errors.map { |err| { message: err.full_message, path: [ err.attribute.to_s.camelize(:lower) ] } } }
    end
  end
end
