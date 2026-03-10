# frozen_string_literal: true

class ChangeLeaveBalanceUsedToDecimal < ActiveRecord::Migration[8.1]
  # Safe in development — small table, no production traffic
  def up
    safety_assured do
      change_column :teacher_leave_balances, :used_annual, :decimal, precision: 5, scale: 1, null: false, default: 0
      change_column :teacher_leave_balances, :used_sick, :decimal, precision: 5, scale: 1, null: false, default: 0
      change_column :teacher_leave_balances, :used_personal, :decimal, precision: 5, scale: 1, null: false, default: 0
    end
  end

  def down
    safety_assured do
      change_column :teacher_leave_balances, :used_annual, :integer, null: false, default: 0
      change_column :teacher_leave_balances, :used_sick, :integer, null: false, default: 0
      change_column :teacher_leave_balances, :used_personal, :integer, null: false, default: 0
    end
  end
end
