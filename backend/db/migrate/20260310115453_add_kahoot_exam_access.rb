class AddKahootExamAccess < ActiveRecord::Migration[8.1]
  def change
    safety_assured do
      add_column :classroom_exams, :access_code, :string, limit: 6
      add_column :classroom_exams, :duration_minutes, :integer
      add_column :classroom_exams, :show_results, :boolean, default: false, null: false

      add_index :classroom_exams, :access_code, unique: true

      add_column :exam_submissions, :auto_submitted, :boolean, default: false, null: false
      add_column :exam_submissions, :session_token, :string

      add_index :exam_submissions, :session_token, unique: true
    end
  end
end
