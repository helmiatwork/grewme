require "test_helper"

class TopicPolicyTest < ActiveSupport::TestCase
  test "teacher can CRUD topics" do
    teacher = teachers(:teacher_alice)
    policy = TopicPolicy.new(teacher, Topic.new)
    assert policy.index?
    assert policy.show?
    assert policy.create?
    assert policy.update?
    assert policy.destroy?
  end

  test "parent has no topic permissions" do
    parent = parents(:parent_carol)
    policy = TopicPolicy.new(parent, Topic.new)
    assert_not policy.index?
    assert_not policy.show?
    assert_not policy.create?
    assert_not policy.update?
    assert_not policy.destroy?
  end

  test "school_manager can CRUD topics" do
    manager = school_managers(:manager_pat)
    policy = TopicPolicy.new(manager, Topic.new)
    assert policy.index?
    assert policy.show?
    assert policy.create?
    assert policy.update?
    assert policy.destroy?
  end
end
