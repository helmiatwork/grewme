class CreateStudents < ActiveRecord::Migration[8.1]
  def change
    create_table :students do |t|
      t.string :name
      t.references :classroom, null: false, foreign_key: true
      t.string :avatar

      t.timestamps
    end
  end
end
