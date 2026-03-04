class DailyScore < ApplicationRecord
  belongs_to :student
  belongs_to :teacher, class_name: "User"

  enum :skill_category, { reading: 0, math: 1, writing: 2, logic: 3, social: 4 }

  validates :date, presence: true
  validates :skill_category, presence: true
  validates :score, presence: true, numericality: { only_integer: true, in: 0..100 }
  validates :student_id, uniqueness: { scope: [ :date, :skill_category ], message: "already has a score for this skill on this date" }

  after_commit :invalidate_radar_cache, on: [ :create, :update, :destroy ]
  after_commit :schedule_radar_refresh, on: [ :create, :update ]

  private

  def invalidate_radar_cache
    Rails.cache.delete("radar:#{student_id}")
    Rails.cache.delete("classroom_overview:#{student.classroom_id}") if student
  end

  def schedule_radar_refresh
    RefreshRadarSummaryJob.perform_later if defined?(RefreshRadarSummaryJob)
  end
end
