class DailyScoreResource
  include Alba::Resource

  root_key :daily_score, :daily_scores
  attributes :id, :date, :skill_category, :score, :notes

  attribute :student_id do |score|
    score.student_id
  end
end
