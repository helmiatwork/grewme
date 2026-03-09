class CreateTeacherLeaveBalances < ActiveRecord::Migration[8.1]
  def change
    create_table :teacher_leave_balances do |t|
      t.references :teacher, null: false, foreign_key: true
      t.references :academic_year, null: false, foreign_key: true
      t.integer :max_annual_leave, null: false, default: 12
      t.integer :max_sick_leave, null: false, default: 14
      t.integer :used_annual, null: false, default: 0
      t.integer :used_sick, null: false, default: 0
      t.integer :used_personal, null: false, default: 0
      t.timestamps
    end
    add_index :teacher_leave_balances, [ :teacher_id, :academic_year_id ], unique: true
  end
end
