require "test_helper"

class LearningObjectivePolicyTest < ActiveSupport::TestCase
  test "teacher can CRUD learning objectives" do
    teacher = teachers(:teacher_alice)
    policy = LearningObjectivePolicy.new(teacher, LearningObjective.new)
    assert policy.index?
    assert policy.show?
    assert policy.create?
    assert policy.update?
    assert policy.destroy?
  end

  test "parent has no learning objective permissions" do
    parent = parents(:parent_carol)
    policy = LearningObjectivePolicy.new(parent, LearningObjective.new)
    assert_not policy.index?
    assert_not policy.show?
    assert_not policy.create?
    assert_not policy.update?
    assert_not policy.destroy?
  end

  test "school_manager can CRUD learning objectives" do
    manager = school_managers(:manager_pat)
    policy = LearningObjectivePolicy.new(manager, LearningObjective.new)
    assert policy.index?
    assert policy.show?
    assert policy.create?
    assert policy.update?
    assert policy.destroy?
  end
end
