class CreateClassroomStudentsAndDailyScores < ActiveRecord::Migration[8.1]
  def change
    create_table :classroom_students do |t|
      t.references :student, null: false, foreign_key: true
      t.references :classroom, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.string :academic_year, null: false
      t.date :enrolled_at, null: false
      t.date :left_at

      t.timestamps
    end

    add_index :classroom_students, [ :student_id, :status ], unique: true,
      where: "status = 0", name: "index_classroom_students_on_student_active"

    create_table :daily_scores do |t|
      t.references :student, null: false, foreign_key: true
      t.references :teacher, null: false, foreign_key: true
      t.date :date, null: false
      t.integer :skill_category, null: false
      t.integer :score, null: false
      t.text :notes

      t.timestamps
    end

    add_index :daily_scores, [ :student_id, :date, :skill_category ], unique: true, name: "idx_daily_scores_unique"
  end
end
