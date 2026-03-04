class CreateStudentRadarSummaries < ActiveRecord::Migration[8.1]
  def change
    create_view :student_radar_summaries, materialized: true
    safety_assured do
      add_index :student_radar_summaries, :student_id, unique: true
      add_index :student_radar_summaries, :classroom_id
    end
  end
end
