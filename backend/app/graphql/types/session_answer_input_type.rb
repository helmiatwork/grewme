# frozen_string_literal: true

module Types
  class SessionAnswerInputType < Types::BaseInputObject
    argument :exam_question_id, ID, required: true
    argument :selected_answer, String, required: true
  end
end
