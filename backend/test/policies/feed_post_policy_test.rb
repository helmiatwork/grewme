require "test_helper"

class FeedPostPolicyTest < ActiveSupport::TestCase
  setup do
    @post = FeedPost.create!(teacher: teachers(:teacher_alice), classroom: classrooms(:alice_class), body: "Test")
  end

  test "teacher in classroom can create" do
    policy = FeedPostPolicy.new(teachers(:teacher_alice), FeedPost.new(classroom: classrooms(:alice_class)))
    assert policy.create?
  end

  test "teacher not in classroom cannot create" do
    # bob only teaches bob_class, not alice_class
    policy = FeedPostPolicy.new(teachers(:teacher_bob), FeedPost.new(classroom: classrooms(:alice_class)))
    assert_not policy.create?
  end

  test "author can destroy own post" do
    policy = FeedPostPolicy.new(teachers(:teacher_alice), @post)
    assert policy.destroy?
  end

  test "non-author cannot destroy" do
    policy = FeedPostPolicy.new(teachers(:teacher_bob), @post)
    assert_not policy.destroy?
  end

  test "parent with child in classroom can view" do
    # carol's child emma is in alice_class
    policy = FeedPostPolicy.new(parents(:parent_carol), @post)
    assert policy.show?
  end

  test "teacher can always view" do
    policy = FeedPostPolicy.new(teachers(:teacher_bob), @post)
    assert policy.show?
  end
end
