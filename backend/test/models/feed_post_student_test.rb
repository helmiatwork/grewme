# frozen_string_literal: true

require "test_helper"

class FeedPostStudentTest < ActiveSupport::TestCase
  test "can tag a student in a post" do
    post = FeedPost.create!(teacher: teachers(:teacher_alice), classroom: classrooms(:alice_class), body: "Test")
    post.tagged_students << students(:student_emma)
    assert_equal 1, post.tagged_students.count
    assert_equal students(:student_emma), post.tagged_students.first
  end

  test "cannot tag same student twice" do
    post = FeedPost.create!(teacher: teachers(:teacher_alice), classroom: classrooms(:alice_class), body: "Test")
    post.tagged_students << students(:student_emma)
    assert_raises(ActiveRecord::RecordInvalid) do
      post.feed_post_students.create!(student: students(:student_emma))
    end
  end
end
