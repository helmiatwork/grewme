# frozen_string_literal: true

module Types
  class TeacherLeaveBalanceType < Types::BaseObject
    field :id, ID, null: false
    field :max_annual_leave, Integer, null: false
    field :max_sick_leave, Integer, null: false
    field :used_annual, Float, null: false
    field :used_sick, Float, null: false
    field :used_personal, Float, null: false
    field :remaining_annual, Float, null: false
    field :remaining_sick, Float, null: false
  end
end
