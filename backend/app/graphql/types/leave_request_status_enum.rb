# frozen_string_literal: true

module Types
  class LeaveRequestStatusEnum < Types::BaseEnum
    value "PENDING", value: "pending"
    value "APPROVED", value: "approved"
    value "REJECTED", value: "rejected"
  end
end
