# frozen_string_literal: true

module Types
  class AttendanceStatusEnum < Types::BaseEnum
    value "PRESENT", value: "present"
    value "SICK", value: "sick"
    value "EXCUSED", value: "excused"
    value "UNEXCUSED", value: "unexcused"
  end
end
