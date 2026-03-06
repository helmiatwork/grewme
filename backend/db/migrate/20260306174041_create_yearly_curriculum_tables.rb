class CreateYearlyCurriculumTables < ActiveRecord::Migration[8.1]
  def change
    create_table :academic_years do |t|
      t.references :school, null: false, foreign_key: true
      t.string :label, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.boolean :current, default: false, null: false
      t.timestamps
    end
    add_index :academic_years, [ :school_id, :label ], unique: true

    create_table :grade_curriculums do |t|
      t.references :academic_year, null: false, foreign_key: true
      t.integer :grade, null: false
      t.timestamps
    end
    add_index :grade_curriculums, [ :academic_year_id, :grade ], unique: true

    create_table :grade_curriculum_items do |t|
      t.references :grade_curriculum, null: false, foreign_key: true
      t.references :subject, null: true, foreign_key: true
      t.references :topic, null: true, foreign_key: true
      t.integer :position, default: 0, null: false
      t.timestamps
    end
    add_index :grade_curriculum_items, [ :grade_curriculum_id, :subject_id, :topic_id ],
      unique: true, name: "idx_grade_curriculum_items_unique"
  end
end
