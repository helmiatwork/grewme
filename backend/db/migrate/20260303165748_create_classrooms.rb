class CreateClassrooms < ActiveRecord::Migration[8.1]
  def change
    create_table :classrooms do |t|
      t.string :name, null: false
      t.references :school, null: false, foreign_key: true
      t.references :teacher, null: false, foreign_key: true

      t.timestamps
    end
  end
end
