require "test_helper"

class BehaviorPointTest < ActiveSupport::TestCase
  test "validates all associations present" do
    bp = BehaviorPoint.new(point_value: 3, awarded_at: Time.current)
    assert_not bp.valid?
    assert_includes bp.errors[:student], "must exist"
    assert_includes bp.errors[:teacher], "must exist"
    assert_includes bp.errors[:classroom], "must exist"
    assert_includes bp.errors[:behavior_category], "must exist"
  end

  test "validates point_value range" do
    base = {
      student: students(:student_emma),
      teacher: teachers(:teacher_alice),
      classroom: classrooms(:alice_class),
      behavior_category: behavior_categories(:helping_others),
      awarded_at: Time.current
    }
    assert_not BehaviorPoint.new(base.merge(point_value: 0)).valid?
    assert_not BehaviorPoint.new(base.merge(point_value: 6)).valid?
    assert_not BehaviorPoint.new(base.merge(point_value: -6)).valid?
    assert BehaviorPoint.new(base.merge(point_value: 3)).valid?
  end

  test "validates awarded_at presence" do
    bp = BehaviorPoint.new(
      student: students(:student_emma),
      teacher: teachers(:teacher_alice),
      classroom: classrooms(:alice_class),
      behavior_category: behavior_categories(:helping_others),
      point_value: 3
    )
    assert_not bp.valid?
    assert_includes bp.errors[:awarded_at], "can't be blank"
  end

  test "scope active excludes revoked" do
    active = behavior_points(:emma_helping)
    revoked = behavior_points(:revoked_point)
    assert_includes BehaviorPoint.active, active
    assert_not_includes BehaviorPoint.active, revoked
  end

  test "scope for_date filters by awarded_at" do
    point = behavior_points(:emma_helping)
    assert BehaviorPoint.for_date(point.awarded_at.to_date).include?(point)
  end

  test "scope positive and negative" do
    assert_includes BehaviorPoint.positive, behavior_points(:emma_helping)
    assert_includes BehaviorPoint.negative, behavior_points(:emma_off_task)
  end

  test "revokable? returns true within 15 minutes" do
    point = BehaviorPoint.new(awarded_at: 10.minutes.ago, revoked_at: nil)
    assert point.revokable?
  end

  test "revokable? returns false after 15 minutes" do
    point = BehaviorPoint.new(awarded_at: 20.minutes.ago, revoked_at: nil)
    assert_not point.revokable?
  end

  test "revokable? returns false if already revoked" do
    point = BehaviorPoint.new(awarded_at: 5.minutes.ago, revoked_at: 3.minutes.ago)
    assert_not point.revokable?
  end

  test "revoke! sets revoked_at" do
    point = behavior_points(:emma_helping)
    point.update!(awarded_at: 5.minutes.ago)
    point.revoke!
    assert_not_nil point.reload.revoked_at
  end

  test "belongs to student, teacher, classroom, behavior_category" do
    point = behavior_points(:emma_helping)
    assert_equal students(:student_emma), point.student
    assert_equal teachers(:teacher_alice), point.teacher
    assert_equal classrooms(:alice_class), point.classroom
    assert_equal behavior_categories(:helping_others), point.behavior_category
  end
end
