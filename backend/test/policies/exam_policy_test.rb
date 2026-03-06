require "test_helper"

class ExamPolicyTest < ActiveSupport::TestCase
  test "teacher can CRUD exams" do
    teacher = teachers(:teacher_alice)
    policy = ExamPolicy.new(teacher, Exam.new)
    assert policy.index?
    assert policy.show?
    assert policy.create?
    assert policy.update?
    assert policy.destroy?
  end

  test "parent can view but not create exams" do
    parent = parents(:parent_carol)
    policy = ExamPolicy.new(parent, Exam.new)
    assert policy.index?
    assert policy.show?
    assert_not policy.create?
    assert_not policy.update?
    assert_not policy.destroy?
  end
end
