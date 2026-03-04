class CreateDailyScores < ActiveRecord::Migration[8.1]
  def change
    create_table :daily_scores do |t|
      t.references :student, null: false, foreign_key: true
      t.references :teacher, null: false, foreign_key: { to_table: :users }
      t.date :date, null: false
      t.integer :skill_category, null: false
      t.integer :score, null: false
      t.text :notes

      t.timestamps
    end

    add_index :daily_scores, [ :student_id, :date, :skill_category ], unique: true, name: "idx_daily_scores_unique"
  end
end
