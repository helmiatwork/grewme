require "test_helper"

class BehaviorCategoryTest < ActiveSupport::TestCase
  test "validates name presence" do
    cat = BehaviorCategory.new(school: schools(:greenwood), point_value: 3, is_positive: true, icon: "🤝", color: "#059669")
    assert_not cat.valid?
    assert_includes cat.errors[:name], "can't be blank"
  end

  test "validates name uniqueness per school" do
    existing = behavior_categories(:helping_others)
    dup = BehaviorCategory.new(
      school: existing.school,
      name: existing.name,
      point_value: 1,
      is_positive: true,
      icon: "✨",
      color: "#000000"
    )
    assert_not dup.valid?
    assert_includes dup.errors[:name], "has already been taken"
  end

  test "validates point_value range -5 to 5 and not zero" do
    base = { school: schools(:greenwood), name: "Test", is_positive: true, icon: "✨", color: "#000000" }

    assert_not BehaviorCategory.new(base.merge(point_value: 0)).valid?
    assert_not BehaviorCategory.new(base.merge(point_value: -6)).valid?
    assert_not BehaviorCategory.new(base.merge(point_value: 6)).valid?
    assert BehaviorCategory.new(base.merge(point_value: 1, name: "A")).valid?
    assert BehaviorCategory.new(base.merge(point_value: -5, is_positive: false, name: "B")).valid?
    assert BehaviorCategory.new(base.merge(point_value: 5, name: "C")).valid?
  end

  test "validates icon and color presence" do
    base = { school: schools(:greenwood), name: "Test", point_value: 1, is_positive: true }
    assert_not BehaviorCategory.new(base.merge(icon: nil, color: "#000000")).valid?
    assert_not BehaviorCategory.new(base.merge(icon: "✨", color: nil)).valid?
  end

  test "belongs to school" do
    cat = behavior_categories(:helping_others)
    assert_equal schools(:greenwood), cat.school
  end

  test "scope active excludes soft-deleted" do
    cat = behavior_categories(:helping_others)
    assert_includes BehaviorCategory.active, cat

    cat.update!(deleted_at: Time.current)
    assert_not_includes BehaviorCategory.active, cat
  end

  test "scope positive and negative" do
    assert_includes BehaviorCategory.positive, behavior_categories(:helping_others)
    assert_includes BehaviorCategory.negative, behavior_categories(:off_task)
    assert_not_includes BehaviorCategory.positive, behavior_categories(:off_task)
  end

  test "soft_delete! sets deleted_at" do
    cat = behavior_categories(:helping_others)
    assert_nil cat.deleted_at
    cat.soft_delete!
    assert_not_nil cat.reload.deleted_at
  end
end
