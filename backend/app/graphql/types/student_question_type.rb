# frozen_string_literal: true

module Types
  class StudentQuestionType < Types::BaseObject
    field :id, ID, null: false
    field :exam_question_id, ID, null: false
    field :student_id, ID, null: false
    field :values, GraphQL::Types::JSON, null: false
    field :generated_text, String, null: false
    field :correct_answer, String, null: false
  end
end
