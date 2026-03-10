# frozen_string_literal: true

module Mutations
  class SaveExamProgress < BaseMutation
    argument :input, Types::SaveExamProgressInputType, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      session_token = input.session_token
      answers = input.answers
      submission = ExamSubmission.find_by(session_token: session_token)
      unless submission&.in_progress?
        return { success: false, errors: [ { message: "Invalid or expired session", path: [ "sessionToken" ] } ] }
      end

      answers.each do |answer_input|
        answer = submission.exam_answers.find_or_initialize_by(
          exam_question_id: answer_input.exam_question_id
        )
        answer.selected_answer = answer_input.selected_answer
        answer.save!
      end

      { success: true, errors: [] }
    end
  end
end
