require "test_helper"

class FeedPostCommentTest < ActiveSupport::TestCase
  setup do
    @post = FeedPost.create!(teacher: teachers(:teacher_alice), classroom: classrooms(:alice_class), body: "Test")
  end

  test "valid comment" do
    comment = FeedPostComment.new(feed_post: @post, commenter: parents(:parent_carol), body: "Nice!")
    assert comment.valid?
  end

  test "requires body" do
    comment = FeedPostComment.new(feed_post: @post, commenter: parents(:parent_carol))
    assert_not comment.valid?
  end

  test "increments comments_count" do
    assert_difference -> { @post.reload.comments_count }, 1 do
      FeedPostComment.create!(feed_post: @post, commenter: parents(:parent_carol), body: "Great!")
    end
  end
end
