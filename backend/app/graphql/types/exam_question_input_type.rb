# frozen_string_literal: true

module Types
  class ExamQuestionInputType < Types::BaseInputObject
    argument :question_text, String, required: true
    argument :options, GraphQL::Types::JSON, required: false
    argument :correct_answer, String, required: true
    argument :points, Integer, required: false
    argument :position, Integer, required: false
  end
end
