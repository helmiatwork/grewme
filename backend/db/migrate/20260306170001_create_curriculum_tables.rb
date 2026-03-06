class CreateCurriculumTables < ActiveRecord::Migration[8.1]
  def change
    create_table :subjects do |t|
      t.string :name, null: false
      t.text :description
      t.references :school, null: false, foreign_key: true
      t.timestamps
    end

    add_index :subjects, [ :school_id, :name ], unique: true

    create_table :topics do |t|
      t.string :name, null: false
      t.text :description
      t.references :subject, null: false, foreign_key: true
      t.integer :position, default: 0, null: false
      t.timestamps
    end

    add_index :topics, [ :subject_id, :name ], unique: true

    create_table :learning_objectives do |t|
      t.string :name, null: false
      t.text :description
      t.references :topic, null: false, foreign_key: true
      t.integer :exam_pass_threshold, null: false, default: 70
      t.integer :daily_score_threshold, null: false, default: 75
      t.integer :position, default: 0, null: false
      t.timestamps
    end

    add_index :learning_objectives, [ :topic_id, :name ], unique: true
  end
end
