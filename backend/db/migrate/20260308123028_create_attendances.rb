class CreateAttendances < ActiveRecord::Migration[8.0]
  def change
    create_table :attendances do |t|
      t.references :student, null: false, foreign_key: true
      t.references :classroom, null: false, foreign_key: true
      t.date :date, null: false
      t.integer :status, null: false, default: 0
      t.string :recorded_by_type
      t.bigint :recorded_by_id
      t.references :leave_request, foreign_key: true
      t.text :notes
      t.timestamps
    end
    add_index :attendances, [ :student_id, :classroom_id, :date ], unique: true, name: "idx_attendances_unique"
    add_index :attendances, [ :classroom_id, :date ]
    add_index :attendances, [ :recorded_by_type, :recorded_by_id ]
  end
end
