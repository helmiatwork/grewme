require "test_helper"

class GradeCurriculumTest < ActiveSupport::TestCase
  setup do
    @school = schools(:greenwood)
    @year = AcademicYear.create!(school: @school, label: "2025/2026", start_date: "2025-07-01", end_date: "2026-06-30")
  end

  test "validates grade uniqueness per academic year" do
    GradeCurriculum.create!(academic_year: @year, grade: 1)
    dup = GradeCurriculum.new(academic_year: @year, grade: 1)
    assert_not dup.valid?
  end

  test "validates grade range 1-12" do
    gc = GradeCurriculum.new(academic_year: @year, grade: 0)
    assert_not gc.valid?
    gc.grade = 13
    assert_not gc.valid?
    gc.grade = 6
    assert gc.valid?
  end

  test "delegates school to academic_year" do
    gc = GradeCurriculum.create!(academic_year: @year, grade: 1)
    assert_equal @school, gc.school
  end
end
