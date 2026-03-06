# frozen_string_literal: true

module Types
  class ExamSubmissionStatusEnum < Types::BaseEnum
    value "NOT_STARTED", value: "not_started"
    value "IN_PROGRESS", value: "in_progress"
    value "SUBMITTED", value: "submitted"
    value "GRADED", value: "graded"
  end
end
