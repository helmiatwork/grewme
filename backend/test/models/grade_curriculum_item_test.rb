require "test_helper"

class GradeCurriculumItemTest < ActiveSupport::TestCase
  setup do
    @school = schools(:greenwood)
    @year = AcademicYear.create!(school: @school, label: "2025/2026", start_date: "2025-07-01", end_date: "2026-06-30")
    @gc = GradeCurriculum.create!(academic_year: @year, grade: 1)
    @subject = Subject.first || Subject.create!(name: "Math", school: @school)
    @topic = @subject.topics.first || Topic.create!(name: "Numbers", subject: @subject, position: 1)
  end

  test "must reference exactly one of subject or topic" do
    item = GradeCurriculumItem.new(grade_curriculum: @gc, position: 1)
    assert_not item.valid?
    assert_includes item.errors[:base].join, "Must reference"
  end

  test "cannot reference both subject and topic" do
    item = GradeCurriculumItem.new(grade_curriculum: @gc, subject: @subject, topic: @topic, position: 1)
    assert_not item.valid?
    assert_includes item.errors[:base].join, "Cannot reference both"
  end

  test "valid with subject only" do
    item = GradeCurriculumItem.new(grade_curriculum: @gc, subject: @subject, position: 1)
    assert item.valid?
  end

  test "valid with topic only" do
    item = GradeCurriculumItem.new(grade_curriculum: @gc, topic: @topic, position: 1)
    assert item.valid?
  end

  test "display_name for subject item" do
    item = GradeCurriculumItem.create!(grade_curriculum: @gc, subject: @subject, position: 1)
    assert_equal "#{@subject.name} (all topics)", item.display_name
  end

  test "display_name for topic item" do
    item = GradeCurriculumItem.create!(grade_curriculum: @gc, topic: @topic, position: 1)
    assert_equal @topic.name, item.display_name
  end

  test "default_scope orders by position" do
    item2 = GradeCurriculumItem.create!(grade_curriculum: @gc, topic: @topic, position: 2)
    item1 = GradeCurriculumItem.create!(grade_curriculum: @gc, subject: @subject, position: 1)
    items = @gc.grade_curriculum_items.to_a
    assert_equal item1, items.first
    assert_equal item2, items.last
  end
end
