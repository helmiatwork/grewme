# frozen_string_literal: true

class LeaveRequest < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :student
  belongs_to :parent
  belongs_to :reviewed_by, class_name: "Teacher", optional: true
  has_many :attendances, dependent: :nullify

  enum :request_type, { sick: 0, excused: 1 }
  enum :status, { pending: 0, approved: 1, rejected: 2 }

  encrypts :reason
  encrypts :rejection_reason

  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :reason, presence: true
  validate :end_date_after_start_date
  validate :parent_owns_student

  scope :pending_for_classroom, ->(classroom_id) {
    joins(student: :classroom_students)
      .merge(ClassroomStudent.current)
      .where(classroom_students: { classroom_id: classroom_id })
      .pending
  }

  def date_range
    start_date..end_date
  end

  def days_count
    (end_date - start_date).to_i + 1
  end

  private

  def end_date_after_start_date
    return if start_date.blank? || end_date.blank?
    if end_date < start_date
      errors.add(:end_date, "must be on or after start date")
    end
  end

  def parent_owns_student
    return if parent.blank? || student.blank?
    unless parent.children.exists?(id: student.id)
      errors.add(:student, "does not belong to this parent")
    end
  end
end
