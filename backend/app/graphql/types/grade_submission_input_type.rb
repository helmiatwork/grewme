# frozen_string_literal: true

module Types
  class GradeSubmissionInputType < Types::BaseInputObject
    argument :exam_submission_id, ID, required: true
    argument :score, Float, required: false
    argument :passed, Boolean, required: false
    argument :teacher_notes, String, required: false
    argument :rubric_scores, [ Types::RubricScoreInputType ], required: false
  end
end
