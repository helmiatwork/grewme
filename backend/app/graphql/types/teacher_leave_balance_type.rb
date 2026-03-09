# frozen_string_literal: true

module Types
  class TeacherLeaveBalanceType < Types::BaseObject
    field :id, ID, null: false
    field :max_annual_leave, Integer, null: false
    field :max_sick_leave, Integer, null: false
    field :used_annual, Integer, null: false
    field :used_sick, Integer, null: false
    field :used_personal, Integer, null: false
    field :remaining_annual, Integer, null: false
    field :remaining_sick, Integer, null: false
  end
end
