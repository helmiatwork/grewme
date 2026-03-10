# frozen_string_literal: true

module Types
  class SaveExamProgressInputType < Types::BaseInputObject
    argument :session_token, String, required: true
    argument :answers, [ Types::SessionAnswerInputType ], required: true
  end
end
