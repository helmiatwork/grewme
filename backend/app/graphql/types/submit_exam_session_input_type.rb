# frozen_string_literal: true

module Types
  class SubmitExamSessionInputType < Types::BaseInputObject
    argument :session_token, String, required: true
  end
end
