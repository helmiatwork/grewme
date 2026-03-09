# frozen_string_literal: true

class Attendance < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :student
  belongs_to :classroom
  belongs_to :recorded_by, polymorphic: true, optional: true
  belongs_to :leave_request, optional: true

  enum :status, { present: 0, sick: 1, excused: 2, unexcused: 3 }

  encrypts :notes

  validates :date, presence: true
  validates :status, presence: true
  validates :student_id, uniqueness: { scope: [ :classroom_id, :date ], message: "already has attendance for this classroom on this date" }

  scope :for_date, ->(date) { where(date: date) }
  scope :for_classroom, ->(classroom_id) { where(classroom_id: classroom_id) }
  scope :absent, -> { where.not(status: :present) }

  after_commit :invalidate_caches, on: [ :create, :update, :destroy ]

  private

  def invalidate_caches
    Rails.cache.delete("classroom_attendance/#{classroom_id}/#{date}")
    Rails.cache.delete("student_attendance/#{student_id}")
  end
end
