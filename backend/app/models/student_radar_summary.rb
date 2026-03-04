class StudentRadarSummary < ApplicationRecord
  self.primary_key = :student_id

  belongs_to :student

  def self.refresh
    Scenic.database.refresh_materialized_view(table_name, concurrently: true, cascade: false)
  end

  def readonly?
    true
  end
end
