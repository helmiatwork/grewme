# frozen_string_literal: true

module Types
  class ExamAnswerType < Types::BaseObject
    field :id, ID, null: false
    field :exam_question, Types::ExamQuestionType, null: false
    field :selected_answer, String
    field :correct, Boolean
    field :points_awarded, Integer, null: false
  end
end
