require "test_helper"

class DailyScoreTest < ActiveSupport::TestCase
  test "validates date presence" do
    score = DailyScore.new(student: students(:student_emma), teacher: users(:teacher_alice), skill_category: :reading, score: 80, date: nil)
    assert_not score.valid?
    assert_includes score.errors[:date], "can't be blank"
  end

  test "validates skill_category presence" do
    score = DailyScore.new(student: students(:student_emma), teacher: users(:teacher_alice), date: Date.new(2026, 3, 10), score: 80, skill_category: nil)
    assert_not score.valid?
    assert_includes score.errors[:skill_category], "can't be blank"
  end

  test "validates score presence" do
    score = DailyScore.new(student: students(:student_emma), teacher: users(:teacher_alice), date: Date.new(2026, 3, 10), skill_category: :reading, score: nil)
    assert_not score.valid?
  end

  test "score must be between 0 and 100" do
    base = { student: students(:student_finn), teacher: users(:teacher_alice), date: Date.new(2026, 3, 10), skill_category: :reading }

    score_neg = DailyScore.new(base.merge(score: -1))
    assert_not score_neg.valid?

    score_over = DailyScore.new(base.merge(score: 101))
    assert_not score_over.valid?

    score_zero = DailyScore.new(base.merge(score: 0))
    assert score_zero.valid?

    score_max = DailyScore.new(base.merge(score: 100))
    assert score_max.valid?
  end

  test "score must be integer" do
    score = DailyScore.new(student: students(:student_finn), teacher: users(:teacher_alice), date: Date.new(2026, 3, 10), skill_category: :reading, score: 85.5)
    assert_not score.valid?
  end

  test "unique per student per date per skill" do
    existing = daily_scores(:emma_reading_day1)
    duplicate = DailyScore.new(
      student: existing.student,
      teacher: existing.teacher,
      date: existing.date,
      skill_category: existing.skill_category,
      score: 90
    )
    assert_not duplicate.valid?
  end

  test "skill_category enum has 5 entries" do
    assert_equal 5, DailyScore.skill_categories.size
    assert_equal %w[reading math writing logic social], DailyScore.skill_categories.keys
  end

  test "belongs to student and teacher" do
    score = daily_scores(:emma_reading_day1)
    assert_equal students(:student_emma), score.student
    assert_equal users(:teacher_alice), score.teacher
  end
end
