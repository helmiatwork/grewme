require "test_helper"

class ClassroomExamPolicyTest < ActiveSupport::TestCase
  test "teacher can manage classroom exams but not destroy" do
    teacher = teachers(:teacher_alice)
    policy = ClassroomExamPolicy.new(teacher, ClassroomExam.new)
    assert policy.index?
    assert policy.show?
    assert policy.create?
    assert policy.update?
    assert_not policy.destroy?
  end

  test "parent has no classroom exam permissions" do
    parent = parents(:parent_carol)
    policy = ClassroomExamPolicy.new(parent, ClassroomExam.new)
    assert_not policy.index?
    assert_not policy.show?
    assert_not policy.create?
    assert_not policy.update?
    assert_not policy.destroy?
  end

  test "school_manager can CRUD classroom exams" do
    manager = school_managers(:manager_pat)
    policy = ClassroomExamPolicy.new(manager, ClassroomExam.new)
    assert policy.index?
    assert policy.show?
    assert policy.create?
    assert policy.update?
    assert policy.destroy?
  end
end
