# frozen_string_literal: true

module Types
  class CreateExamInputType < Types::BaseInputObject
    argument :title, String, required: true
    argument :description, String, required: false
    argument :exam_type, Types::ExamTypeEnum, required: true
    argument :topic_id, ID, required: true
    argument :max_score, Integer, required: false
    argument :duration_minutes, Integer, required: false
    argument :questions, [ Types::ExamQuestionInputType ], required: false
    argument :rubric_criteria, [ Types::RubricCriteriaInputType ], required: false
  end
end
