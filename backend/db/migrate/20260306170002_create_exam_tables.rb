class CreateExamTables < ActiveRecord::Migration[8.1]
  def change
    create_table :exams do |t|
      t.string :title, null: false
      t.text :description
      t.integer :exam_type, null: false, default: 0
      t.references :topic, null: false, foreign_key: true
      t.references :created_by, polymorphic: true, null: false
      t.integer :max_score, default: 100
      t.integer :duration_minutes
      t.timestamps
    end

    add_index :exams, [ :topic_id, :exam_type ]

    create_table :exam_questions do |t|
      t.references :exam, null: false, foreign_key: true
      t.text :question_text, null: false
      t.jsonb :options, default: []
      t.string :correct_answer, null: false
      t.integer :points, null: false, default: 1
      t.integer :position, default: 0, null: false
      t.timestamps
    end

    add_index :exam_questions, [ :exam_id, :position ]

    create_table :rubric_criteria do |t|
      t.references :exam, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.integer :max_score, null: false, default: 5
      t.integer :position, default: 0, null: false
      t.timestamps
    end

    add_index :rubric_criteria, [ :exam_id, :position ]

    create_table :classroom_exams do |t|
      t.references :exam, null: false, foreign_key: true
      t.references :classroom, null: false, foreign_key: true
      t.references :assigned_by, polymorphic: true, null: false
      t.datetime :scheduled_at
      t.datetime :due_at
      t.integer :status, null: false, default: 0
      t.timestamps
    end

    add_index :classroom_exams, [ :classroom_id, :exam_id ], unique: true
    add_index :classroom_exams, [ :classroom_id, :status ]

    create_table :exam_submissions do |t|
      t.references :student, null: false, foreign_key: true
      t.references :classroom_exam, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.decimal :score, precision: 5, scale: 2
      t.boolean :passed
      t.datetime :started_at
      t.datetime :submitted_at
      t.datetime :graded_at
      t.text :teacher_notes
      t.timestamps
    end

    add_index :exam_submissions, [ :student_id, :classroom_exam_id ], unique: true

    create_table :exam_answers do |t|
      t.references :exam_submission, null: false, foreign_key: true
      t.references :exam_question, null: false, foreign_key: true
      t.string :selected_answer
      t.boolean :correct
      t.integer :points_awarded, default: 0
      t.timestamps
    end

    add_index :exam_answers, [ :exam_submission_id, :exam_question_id ], unique: true

    create_table :rubric_scores do |t|
      t.references :exam_submission, null: false, foreign_key: true
      t.references :rubric_criteria, null: false, foreign_key: true
      t.integer :score, null: false
      t.text :feedback
      t.timestamps
    end

    add_index :rubric_scores, [ :exam_submission_id, :rubric_criteria_id ], unique: true, name: "idx_rubric_scores_unique"

    create_table :objective_masteries do |t|
      t.references :student, null: false, foreign_key: true
      t.references :learning_objective, null: false, foreign_key: true
      t.boolean :exam_mastered, default: false, null: false
      t.boolean :daily_mastered, default: false, null: false
      t.datetime :mastered_at
      t.timestamps
    end

    add_index :objective_masteries, [ :student_id, :learning_objective_id ], unique: true, name: "idx_objective_masteries_unique"
  end
end
