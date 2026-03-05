require "test_helper"

class FeedPostLikeTest < ActiveSupport::TestCase
  setup do
    @post = FeedPost.create!(teacher: teachers(:teacher_alice), classroom: classrooms(:alice_class), body: "Test")
  end

  test "can like a post" do
    like = FeedPostLike.create!(feed_post: @post, liker: parents(:parent_carol))
    assert like.persisted?
  end

  test "cannot like same post twice" do
    FeedPostLike.create!(feed_post: @post, liker: parents(:parent_carol))
    duplicate = FeedPostLike.new(feed_post: @post, liker: parents(:parent_carol))
    assert_not duplicate.valid?
  end

  test "increments likes_count" do
    assert_difference -> { @post.reload.likes_count }, 1 do
      FeedPostLike.create!(feed_post: @post, liker: parents(:parent_carol))
    end
  end
end
