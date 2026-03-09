# frozen_string_literal: true

module Types
  class TeacherLeaveRequestTypeEnum < Types::BaseEnum
    value "SICK", value: "sick"
    value "PERSONAL", value: "personal"
    value "ANNUAL", value: "annual"
  end
end
