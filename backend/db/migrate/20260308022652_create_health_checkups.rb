class CreateHealthCheckups < ActiveRecord::Migration[8.1]
  def change
    create_table :health_checkups do |t|
      t.references :student, null: false, foreign_key: true
      t.references :teacher, null: false, foreign_key: true
      t.date :measured_at, null: false
      t.decimal :weight_kg, precision: 5, scale: 2
      t.decimal :height_cm, precision: 5, scale: 1
      t.decimal :head_circumference_cm, precision: 4, scale: 1
      t.decimal :bmi, precision: 4, scale: 1
      t.text :notes
      t.timestamps
    end

    add_index :health_checkups, [ :student_id, :measured_at ], unique: true
  end
end
