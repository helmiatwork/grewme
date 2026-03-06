class DailyScore < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :student
  belongs_to :teacher

  enum :skill_category, { reading: 0, math: 1, writing: 2, logic: 3, social: 4 }

  validates :date, presence: true
  validates :skill_category, presence: true
  validates :score, presence: true, numericality: { only_integer: true, in: 0..100 }
  validates :student_id, uniqueness: { scope: [ :date, :skill_category ], message: "already has a score for this skill on this date" }

  after_commit :invalidate_caches, on: [ :create, :update, :destroy ]
  after_commit :schedule_radar_refresh, on: [ :create, :update ]

  private

  def schedule_radar_refresh
    RefreshRadarSummaryJob.perform_later if defined?(RefreshRadarSummaryJob)
  end

  def invalidate_caches
    Rails.cache.delete("student_radar/#{student_id}")
    Rails.cache.delete("student_progress/#{student_id}")
    # Invalidate classroom overviews for all classrooms this student belongs to
    student.classroom_students.where(status: :active).pluck(:classroom_id).each do |cid|
      Rails.cache.delete("classroom_overview/#{cid}")
    end
  end
end
