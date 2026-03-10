class AddParameterizedQuestions < ActiveRecord::Migration[8.1]
  def change
    # Extend exam_questions with parameterized fields
    add_column :exam_questions, :parameterized, :boolean, default: false, null: false
    add_column :exam_questions, :template_text, :string
    add_column :exam_questions, :variables, :jsonb, default: []
    add_column :exam_questions, :formula, :string
    add_column :exam_questions, :value_mode, :integer, default: 0 # 0=fixed, 1=shuffled
    add_column :exam_questions, :fixed_values, :jsonb, default: {}

    # Relax NOT NULL on question_text and correct_answer for parameterized questions
    safety_assured do
      change_column_null :exam_questions, :question_text, true
      change_column_null :exam_questions, :correct_answer, true
    end

    # Pre-built question template library
    create_table :question_templates do |t|
      t.string :name, null: false
      t.string :category, null: false
      t.integer :grade_min, null: false, default: 1
      t.integer :grade_max, null: false, default: 12
      t.string :template_text, null: false
      t.jsonb :variables, null: false, default: []
      t.string :formula, null: false
      t.timestamps
    end

    add_index :question_templates, :category
    add_index :question_templates, [ :grade_min, :grade_max ]

    # Per-student question instances
    create_table :student_questions do |t|
      t.references :exam_question, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: true
      t.references :classroom_exam, null: false, foreign_key: true
      t.jsonb :values, null: false, default: {}
      t.string :generated_text, null: false
      t.string :correct_answer, null: false
      t.timestamps
    end

    add_index :student_questions,
      [ :exam_question_id, :student_id, :classroom_exam_id ],
      unique: true,
      name: "idx_student_questions_unique"

    # Link exam_answers to student_questions (optional, for parameterized)
    safety_assured do
      add_reference :exam_answers, :student_question, foreign_key: true, null: true
    end
  end
end
