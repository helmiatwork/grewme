require "test_helper"

class BehaviorSummaryTest < ActiveSupport::TestCase
  test "validates uniqueness per student, classroom, week" do
    existing = behavior_summaries(:emma_week1)
    dup = BehaviorSummary.new(
      student: existing.student,
      classroom: existing.classroom,
      week_start: existing.week_start,
      total_points: 5,
      positive_count: 2,
      negative_count: 1
    )
    assert_not dup.valid?
  end

  test "belongs to student and classroom" do
    summary = behavior_summaries(:emma_week1)
    assert_equal students(:student_emma), summary.student
    assert_equal classrooms(:alice_class), summary.classroom
  end

  test "top_behavior_category is optional" do
    summary = BehaviorSummary.new(
      student: students(:student_finn),
      classroom: classrooms(:alice_class),
      week_start: Date.new(2026, 3, 16),
      total_points: 0,
      positive_count: 0,
      negative_count: 0,
      top_behavior_category: nil
    )
    assert summary.valid?
  end
end
