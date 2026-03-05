require "test_helper"

class FeedPostTest < ActiveSupport::TestCase
  test "valid feed post" do
    post = FeedPost.new(
      teacher: teachers(:teacher_alice),
      classroom: classrooms(:alice_class),
      body: "Great day in class!"
    )
    assert post.valid?
  end

  test "requires body" do
    post = FeedPost.new(teacher: teachers(:teacher_alice), classroom: classrooms(:alice_class))
    assert_not post.valid?
    assert_includes post.errors[:body], "can't be blank"
  end

  test "requires teacher" do
    post = FeedPost.new(classroom: classrooms(:alice_class), body: "Hello")
    assert_not post.valid?
  end

  test "requires classroom" do
    post = FeedPost.new(teacher: teachers(:teacher_alice), body: "Hello")
    assert_not post.valid?
  end
end
