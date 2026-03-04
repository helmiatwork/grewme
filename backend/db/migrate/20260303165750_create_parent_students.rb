class CreateParentStudents < ActiveRecord::Migration[8.1]
  def change
    create_table :parent_students do |t|
      t.references :parent, null: false, foreign_key: { to_table: :users }
      t.references :student, null: false, foreign_key: true

      t.timestamps
    end

    add_index :parent_students, [ :parent_id, :student_id ], unique: true
  end
end
