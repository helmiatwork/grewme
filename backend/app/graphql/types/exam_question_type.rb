# frozen_string_literal: true

module Types
  class ExamQuestionType < Types::BaseObject
    field :id, ID, null: false
    field :question_text, String, null: false
    field :options, GraphQL::Types::JSON
    field :correct_answer, String, null: false
    field :points, Integer, null: false
    field :position, Integer, null: false
  end
end
