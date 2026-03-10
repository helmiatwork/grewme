# frozen_string_literal: true

module Types
  class ExamQuestionType < Types::BaseObject
    field :id, ID, null: false
    field :question_text, String
    field :options, GraphQL::Types::JSON
    field :correct_answer, String
    field :points, Integer, null: false
    field :position, Integer, null: false
    field :parameterized, Boolean, null: false
    field :template_text, String
    field :variables, GraphQL::Types::JSON
    field :formula, String
    field :value_mode, String
    field :fixed_values, GraphQL::Types::JSON
    field :student_questions, [ Types::StudentQuestionType ], null: false

    def value_mode
      object.value_mode
    end
  end
end
