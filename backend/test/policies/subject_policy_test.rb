require "test_helper"

class SubjectPolicyTest < ActiveSupport::TestCase
  test "teacher can CRUD subjects" do
    teacher = teachers(:teacher_alice)
    policy = SubjectPolicy.new(teacher, Subject.new)
    assert policy.index?
    assert policy.show?
    assert policy.create?
    assert policy.update?
    assert policy.destroy?
  end

  test "parent can view but not create subjects" do
    parent = parents(:parent_carol)
    policy = SubjectPolicy.new(parent, Subject.new)
    assert policy.index?
    assert policy.show?
    assert_not policy.create?
    assert_not policy.update?
    assert_not policy.destroy?
  end

  test "school_manager can CRUD subjects" do
    manager = school_managers(:manager_pat)
    policy = SubjectPolicy.new(manager, Subject.new)
    assert policy.index?
    assert policy.create?
    assert policy.destroy?
  end
end
