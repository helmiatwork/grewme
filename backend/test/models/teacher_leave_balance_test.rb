require "test_helper"

class TeacherLeaveBalanceTest < ActiveSupport::TestCase
  setup do
    @teacher = teachers(:teacher_alice)
    @school = schools(:greenwood)
  end

  test "find_or_create_for creates balance with school defaults" do
    # Need a current academic year
    year = AcademicYear.find_or_create_by!(school: @school, label: "Test Year") do |ay|
      ay.start_date = Date.new(2025, 7, 1)
      ay.end_date = Date.new(2026, 6, 30)
      ay.current = true
    end

    balance = TeacherLeaveBalance.find_or_create_for(@teacher, year)
    assert_equal @school.max_annual_leave_days, balance.max_annual_leave
    assert_equal @school.max_sick_leave_days, balance.max_sick_leave
    assert_equal 0, balance.used_annual
    assert_equal 0, balance.used_sick
    assert_equal 0, balance.used_personal
  end

  test "remaining_annual calculation" do
    balance = TeacherLeaveBalance.new(max_annual_leave: 12, used_annual: 3, used_personal: 2)
    assert_equal 7, balance.remaining_annual
  end

  test "remaining_sick calculation" do
    balance = TeacherLeaveBalance.new(max_sick_leave: 14, used_sick: 5)
    assert_equal 9, balance.remaining_sick
  end

  test "increment_usage for sick" do
    year = AcademicYear.find_or_create_by!(school: @school, label: "Test Year") do |ay|
      ay.start_date = Date.new(2025, 7, 1)
      ay.end_date = Date.new(2026, 6, 30)
    end
    balance = TeacherLeaveBalance.find_or_create_for(@teacher, year)
    balance.increment_usage!("sick", 2)
    assert_equal 2, balance.reload.used_sick
  end

  test "decrement_usage does not go below zero" do
    year = AcademicYear.find_or_create_by!(school: @school, label: "Test Year") do |ay|
      ay.start_date = Date.new(2025, 7, 1)
      ay.end_date = Date.new(2026, 6, 30)
    end
    balance = TeacherLeaveBalance.find_or_create_for(@teacher, year)
    balance.decrement_usage!("sick", 5)
    assert_equal 0, balance.reload.used_sick
  end

  test "unique constraint on teacher + academic_year" do
    year = AcademicYear.find_or_create_by!(school: @school, label: "Test Year") do |ay|
      ay.start_date = Date.new(2025, 7, 1)
      ay.end_date = Date.new(2026, 6, 30)
    end
    TeacherLeaveBalance.find_or_create_for(@teacher, year)
    dup = TeacherLeaveBalance.new(teacher: @teacher, academic_year: year, max_annual_leave: 12, max_sick_leave: 14)
    assert_not dup.valid?
  end
end
