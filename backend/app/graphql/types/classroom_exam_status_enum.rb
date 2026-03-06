# frozen_string_literal: true

module Types
  class ClassroomExamStatusEnum < Types::BaseEnum
    value "DRAFT", value: "draft"
    value "ACTIVE", value: "active"
    value "CLOSED", value: "closed"
  end
end
