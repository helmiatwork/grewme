require "test_helper"

class FeedPostsQueryTest < ActiveSupport::TestCase
  setup do
    @post = FeedPost.create!(teacher: teachers(:teacher_alice), classroom: classrooms(:alice_class), body: "Hello parents!")
    FeedPostComment.create!(feed_post: @post, commenter: parents(:parent_carol), body: "Thanks!")
  end

  test "parent can query feed posts for their children's classrooms" do
    result = execute_query(
      query: "query { feedPosts { nodes { id body teacher { name } likesCount commentsCount } } }",
      user: parents(:parent_carol)
    )

    posts = result.dig("data", "feedPosts", "nodes")
    assert_equal 1, posts.length
    assert_equal "Hello parents!", posts[0]["body"]
    assert_equal "Alice Teacher", posts[0]["teacher"]["name"]
  end

  test "teacher can query feed posts for their classrooms" do
    result = execute_query(
      query: "query { feedPosts { nodes { id body } } }",
      user: teachers(:teacher_alice)
    )

    posts = result.dig("data", "feedPosts", "nodes")
    assert_equal 1, posts.length
  end

  test "single feed post query" do
    result = execute_query(
      query: "query($id: ID!) { feedPost(id: $id) { id body comments { body commenterName } } }",
      variables: { id: @post.id.to_s },
      user: parents(:parent_carol)
    )

    post = result.dig("data", "feedPost")
    assert_equal "Hello parents!", post["body"]
    assert_equal 1, post["comments"].length
    assert_equal "Thanks!", post["comments"][0]["body"]
  end
end
