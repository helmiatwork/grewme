class CreateTeacherLeaveRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :teacher_leave_requests do |t|
      t.references :teacher, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.integer :request_type, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.text :reason, null: false
      t.text :rejection_reason
      t.references :reviewed_by, foreign_key: { to_table: :school_managers }
      t.datetime :reviewed_at
      t.references :substitute, foreign_key: { to_table: :teachers }
      t.timestamps
    end
    add_index :teacher_leave_requests, [ :teacher_id, :status ]
    add_index :teacher_leave_requests, [ :school_id, :status ]
  end
end
