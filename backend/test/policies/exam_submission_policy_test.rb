require "test_helper"

class ExamSubmissionPolicyTest < ActiveSupport::TestCase
  test "teacher can manage exam submissions but not destroy" do
    teacher = teachers(:teacher_alice)
    policy = ExamSubmissionPolicy.new(teacher, ExamSubmission.new)
    assert policy.index?
    assert policy.show?
    assert policy.create?
    assert policy.update?
    assert_not policy.destroy?
  end

  test "parent can view but not manage exam submissions" do
    parent = parents(:parent_carol)
    policy = ExamSubmissionPolicy.new(parent, ExamSubmission.new)
    assert policy.index?
    assert policy.show?
    assert_not policy.create?
    assert_not policy.update?
    assert_not policy.destroy?
  end

  test "school_manager can view but not create/destroy exam submissions" do
    manager = school_managers(:manager_pat)
    policy = ExamSubmissionPolicy.new(manager, ExamSubmission.new)
    assert policy.index?
    assert policy.show?
    assert_not policy.create?
    assert_not policy.update?
    assert_not policy.destroy?
  end
end
