# frozen_string_literal: true

module Types
  class ExamTypeEnum < Types::BaseEnum
    value "SCORE_BASED", value: "score_based"
    value "MULTIPLE_CHOICE", value: "multiple_choice"
    value "RUBRIC", value: "rubric"
    value "PASS_FAIL", value: "pass_fail"
  end
end
