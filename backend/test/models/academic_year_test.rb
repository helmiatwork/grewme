require "test_helper"

class AcademicYearTest < ActiveSupport::TestCase
  setup do
    @school = schools(:greenwood)
    @year = academic_years(:current_year)
  end

  test "validates label uniqueness per school" do
    dup = AcademicYear.new(school: @school, label: "2025/2026", start_date: "2025-07-01", end_date: "2026-06-30")
    assert_not dup.valid?
  end

  test "validates end_date after start_date" do
    @year.end_date = "2025-01-01"
    assert_not @year.valid?
  end

  test "set_as_current! unsets other current years" do
    @year.update!(current: true)
    year2 = AcademicYear.create!(school: @school, label: "2026/2027", start_date: "2026-07-01", end_date: "2027-06-30")
    year2.set_as_current!
    assert year2.reload.current?
    assert_not @year.reload.current?
  end

  test "validates label presence" do
    year = AcademicYear.new(school: @school, label: nil, start_date: "2025-07-01", end_date: "2026-06-30")
    assert_not year.valid?
  end

  test "validates start_date and end_date presence" do
    year = AcademicYear.new(school: @school, label: "2027/2028", start_date: nil, end_date: nil)
    assert_not year.valid?
    assert_includes year.errors[:start_date], "can't be blank"
    assert_includes year.errors[:end_date], "can't be blank"
  end

  test "current_year scope returns only current years" do
    @year.update!(current: true)
    non_current = AcademicYear.create!(school: @school, label: "2026/2027", start_date: "2026-07-01", end_date: "2027-06-30", current: false)
    assert_includes AcademicYear.current_year, @year
    assert_not_includes AcademicYear.current_year, non_current
  end
end
