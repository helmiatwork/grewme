# frozen_string_literal: true

module Types
  class ExamQuestionInputType < Types::BaseInputObject
    argument :question_text, String, required: false
    argument :options, GraphQL::Types::JSON, required: false
    argument :correct_answer, String, required: false
    argument :points, Integer, required: false
    argument :position, Integer, required: false
    argument :parameterized, Boolean, required: false
    argument :template_text, String, required: false
    argument :variables, [ Types::VariableInputType ], required: false
    argument :formula, String, required: false
    argument :value_mode, String, required: false
    argument :fixed_values, GraphQL::Types::JSON, required: false
  end
end
