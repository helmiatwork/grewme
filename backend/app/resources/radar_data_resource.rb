class RadarDataResource
  include Alba::Resource

  root_key :radar

  attributes :student_id, :student_name

  attribute :skills do |summary|
    {
      reading: summary.avg_reading&.round(1),
      math: summary.avg_math&.round(1),
      writing: summary.avg_writing&.round(1),
      logic: summary.avg_logic&.round(1),
      social: summary.avg_social&.round(1)
    }
  end

  attribute :total_days_scored do |summary|
    summary.respond_to?(:total_days_scored) ? summary.total_days_scored : nil
  end
end
