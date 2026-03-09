class AddLeaveLimitsToSchools < ActiveRecord::Migration[8.1]
  def change
    add_column :schools, :max_annual_leave_days, :integer, default: 12, null: false
    add_column :schools, :max_sick_leave_days, :integer, default: 14, null: false
  end
end
