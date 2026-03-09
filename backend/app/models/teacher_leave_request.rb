# frozen_string_literal: true

class TeacherLeaveRequest < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :teacher
  belongs_to :school
  belongs_to :reviewed_by, class_name: "SchoolManager", optional: true
  belongs_to :substitute, class_name: "Teacher", optional: true

  enum :request_type, { sick: 0, personal: 1, annual: 2 }
  enum :status, { pending: 0, approved: 1, rejected: 2 }

  encrypts :reason
  encrypts :rejection_reason

  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :reason, presence: true
  validate :end_date_after_start_date
  validate :teacher_belongs_to_school
  validate :substitute_is_different_teacher
  validate :check_leave_balance, on: :create

  def days_count
    (end_date - start_date).to_i + 1
  end

  def date_range
    start_date..end_date
  end

  private

  def end_date_after_start_date
    return if start_date.blank? || end_date.blank?
    errors.add(:end_date, "must be on or after start date") if end_date < start_date
  end

  def teacher_belongs_to_school
    return if teacher.blank? || school.blank?
    errors.add(:teacher, "does not belong to this school") unless teacher.school_id == school.id
  end

  def substitute_is_different_teacher
    return if substitute_id.blank?
    errors.add(:substitute, "cannot be the same teacher") if substitute_id == teacher_id
    errors.add(:substitute, "must belong to the same school") if substitute&.school_id != school_id
  end

  def check_leave_balance
    return if teacher.blank? || school.blank? || start_date.blank? || end_date.blank?

    academic_year = school.academic_years.current_year.first
    return unless academic_year

    balance = TeacherLeaveBalance.find_or_create_for(teacher, academic_year)
    days = days_count

    case request_type
    when "sick"
      remaining = balance.max_sick_leave - balance.used_sick
      errors.add(:base, "Insufficient sick leave balance (#{remaining} days remaining)") if days > remaining
    when "personal", "annual"
      remaining = balance.max_annual_leave - balance.used_annual - balance.used_personal
      errors.add(:base, "Insufficient annual leave balance (#{remaining} days remaining)") if days > remaining
    end
  end
end
