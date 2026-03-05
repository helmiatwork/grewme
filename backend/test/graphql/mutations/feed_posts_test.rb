require "test_helper"

class FeedPostMutationsTest < ActiveSupport::TestCase
  test "teacher creates feed post" do
    result = execute_query(
      mutation: 'mutation($classroomId: ID!, $body: String!) {
        createFeedPost(classroomId: $classroomId, body: $body) {
          feedPost { id body }
          errors { message }
        }
      }',
      variables: { classroomId: classrooms(:alice_class).id.to_s, body: "Great day!" },
      user: teachers(:teacher_alice)
    )

    post = result.dig("data", "createFeedPost", "feedPost")
    assert_not_nil post
    assert_equal "Great day!", post["body"]
  end

  test "parent cannot create feed post" do
    result = execute_query(
      mutation: 'mutation($classroomId: ID!, $body: String!) {
        createFeedPost(classroomId: $classroomId, body: $body) {
          feedPost { id }
          errors { message }
        }
      }',
      variables: { classroomId: classrooms(:alice_class).id.to_s, body: "Hello" },
      user: parents(:parent_carol)
    )

    errors = result["errors"]
    assert_not_nil errors
    assert errors.any? { |e| e["message"].include?("authorized") || e["message"].include?("Authorized") }
  end

  test "parent likes a post" do
    post = FeedPost.create!(teacher: teachers(:teacher_alice), classroom: classrooms(:alice_class), body: "Test")

    result = execute_query(
      mutation: "mutation($id: ID!) { likeFeedPost(id: $id) { feedPost { id likesCount likedByMe } } }",
      variables: { id: post.id.to_s },
      user: parents(:parent_carol)
    )

    data = result.dig("data", "likeFeedPost", "feedPost")
    assert_equal 1, data["likesCount"]
    assert_equal true, data["likedByMe"]
  end

  test "parent unlikes a post (toggle)" do
    post = FeedPost.create!(teacher: teachers(:teacher_alice), classroom: classrooms(:alice_class), body: "Test")
    FeedPostLike.create!(feed_post: post, liker: parents(:parent_carol))

    result = execute_query(
      mutation: "mutation($id: ID!) { likeFeedPost(id: $id) { feedPost { id likesCount likedByMe } } }",
      variables: { id: post.id.to_s },
      user: parents(:parent_carol)
    )

    data = result.dig("data", "likeFeedPost", "feedPost")
    assert_equal 0, data["likesCount"]
    assert_equal false, data["likedByMe"]
  end

  test "parent comments on a post" do
    post = FeedPost.create!(teacher: teachers(:teacher_alice), classroom: classrooms(:alice_class), body: "Test")

    result = execute_query(
      mutation: 'mutation($id: ID!, $body: String!) {
        commentOnFeedPost(id: $id, body: $body) {
          comment { id body commenterName }
        }
      }',
      variables: { id: post.id.to_s, body: "Nice work!" },
      user: parents(:parent_carol)
    )

    comment = result.dig("data", "commentOnFeedPost", "comment")
    assert_equal "Nice work!", comment["body"]
    assert_equal "Carol Parent", comment["commenterName"]
  end

  test "teacher deletes own post" do
    post = FeedPost.create!(teacher: teachers(:teacher_alice), classroom: classrooms(:alice_class), body: "Test")

    result = execute_query(
      mutation: "mutation($id: ID!) { deleteFeedPost(id: $id) { success } }",
      variables: { id: post.id.to_s },
      user: teachers(:teacher_alice)
    )

    assert_equal true, result.dig("data", "deleteFeedPost", "success")
    assert_nil FeedPost.find_by(id: post.id)
  end
end
