class AddGradeFields < ActiveRecord::Migration[8.1]
  def change
    add_column :schools, :min_grade, :integer, default: 1, null: false
    add_column :schools, :max_grade, :integer, default: 6, null: false
    add_column :classrooms, :grade, :integer
  end
end
