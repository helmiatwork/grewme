# frozen_string_literal: true

module Types
  class SubmitAnswersInputType < Types::BaseInputObject
    argument :classroom_exam_id, ID, required: true
    argument :answers, [ Types::AnswerInputType ], required: true
  end
end
