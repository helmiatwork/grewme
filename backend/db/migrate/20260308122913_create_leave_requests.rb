class CreateLeaveRequests < ActiveRecord::Migration[8.0]
  def change
    create_table :leave_requests do |t|
      t.references :student, null: false, foreign_key: true
      t.references :parent, null: false, foreign_key: true
      t.integer :request_type, null: false, default: 0
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.text :reason, null: false
      t.integer :status, null: false, default: 0
      t.references :reviewed_by, foreign_key: { to_table: :teachers }
      t.datetime :reviewed_at
      t.text :rejection_reason
      t.timestamps
    end
    add_index :leave_requests, [ :student_id, :status ]
    add_index :leave_requests, [ :parent_id, :status ]
  end
end
