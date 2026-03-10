# frozen_string_literal: true

module Types
  class StartExamInputType < Types::BaseInputObject
    argument :access_code, String, required: true
    argument :student_id, ID, required: true
  end
end
