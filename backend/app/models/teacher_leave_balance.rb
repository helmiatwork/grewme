# frozen_string_literal: true

class TeacherLeaveBalance < ApplicationRecord
  belongs_to :teacher
  belongs_to :academic_year

  validates :teacher_id, uniqueness: { scope: :academic_year_id }
  validates :max_annual_leave, :max_sick_leave, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :used_annual, :used_sick, :used_personal, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  def self.find_or_create_for(teacher, academic_year)
    find_or_create_by!(teacher: teacher, academic_year: academic_year) do |balance|
      balance.max_annual_leave = teacher.school&.max_annual_leave_days || 12
      balance.max_sick_leave = teacher.school&.max_sick_leave_days || 14
    end
  end

  def remaining_annual
    max_annual_leave - used_annual - used_personal
  end

  def remaining_sick
    max_sick_leave - used_sick
  end

  def increment_usage!(request_type, days)
    case request_type
    when "sick"
      increment!(:used_sick, days)
    when "personal"
      increment!(:used_personal, days)
    when "annual"
      increment!(:used_annual, days)
    end
  end

  def decrement_usage!(request_type, days)
    case request_type
    when "sick"
      update!(used_sick: [ used_sick - days, 0 ].max)
    when "personal"
      update!(used_personal: [ used_personal - days, 0 ].max)
    when "annual"
      update!(used_annual: [ used_annual - days, 0 ].max)
    end
  end
end
