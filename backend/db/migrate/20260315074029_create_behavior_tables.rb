class CreateBehaviorTables < ActiveRecord::Migration[8.1]
  def change
    safety_assured do
      create_table :behavior_categories do |t|
        t.references :school, null: false, foreign_key: true
        t.string :name, null: false
        t.text :description
        t.integer :point_value, null: false
        t.boolean :is_positive, null: false, default: true
        t.string :icon, null: false
        t.string :color, null: false
        t.integer :position, null: false, default: 0
        t.datetime :deleted_at
        t.timestamps
      end

      add_index :behavior_categories, [ :school_id, :name ], unique: true, where: "deleted_at IS NULL", name: "idx_behavior_categories_unique_name_per_school"

      create_table :behavior_points do |t|
        t.references :student, null: false, foreign_key: true
        t.references :teacher, null: false, foreign_key: true
        t.references :classroom, null: false, foreign_key: true
        t.references :behavior_category, null: false, foreign_key: true
        t.integer :point_value, null: false
        t.text :note
        t.datetime :awarded_at, null: false
        t.datetime :revoked_at
        t.timestamps
      end

      add_index :behavior_points, [ :student_id, :awarded_at ]
      add_index :behavior_points, [ :classroom_id, :awarded_at ]

      create_table :behavior_summaries do |t|
        t.references :student, null: false, foreign_key: true
        t.references :classroom, null: false, foreign_key: true
        t.date :week_start, null: false
        t.integer :total_points, null: false, default: 0
        t.integer :positive_count, null: false, default: 0
        t.integer :negative_count, null: false, default: 0
        t.references :top_behavior_category, foreign_key: { to_table: :behavior_categories }
        t.timestamps
      end

      add_index :behavior_summaries, [ :student_id, :classroom_id, :week_start ], unique: true, name: "idx_behavior_summaries_unique_per_student_week"
    end
  end
end
