# frozen_string_literal: true

require "test_helper"

class TopicMutationsTest < ActiveSupport::TestCase
  CREATE_MUTATION = <<~GQL
    mutation($input: CreateTopicInput!) {
      createTopic(input: $input) {
        topic { id name description position }
        errors { message path }
      }
    }
  GQL

  UPDATE_MUTATION = <<~GQL
    mutation($input: UpdateTopicInput!) {
      updateTopic(input: $input) {
        topic { id name description position }
        errors { message path }
      }
    }
  GQL

  DELETE_MUTATION = <<~GQL
    mutation($id: ID!) {
      deleteTopic(id: $id) {
        success
        errors { message path }
      }
    }
  GQL

  test "teacher can create a topic" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { input: { name: "Geometry", subjectId: subjects(:math).id.to_s, position: 5 } },
      user: teacher
    )
    data = result["data"]["createTopic"]
    assert_empty data["errors"]
    assert_equal "Geometry", data["topic"]["name"]
    assert_equal 5, data["topic"]["position"]
  end

  test "returns error for duplicate topic name in same subject" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { input: { name: "Fractions", subjectId: subjects(:math).id.to_s } },
      user: teacher
    )
    data = result["data"]["createTopic"]
    assert_not_empty data["errors"]
  end

  test "teacher can update a topic" do
    teacher = teachers(:teacher_alice)
    topic = topics(:fractions)
    result = execute_query(
      mutation: UPDATE_MUTATION,
      variables: { input: { id: topic.id.to_s, name: "Advanced Fractions", position: 10 } },
      user: teacher
    )
    data = result["data"]["updateTopic"]
    assert_empty data["errors"]
    assert_equal "Advanced Fractions", data["topic"]["name"]
    assert_equal 10, data["topic"]["position"]
  end

  test "teacher can delete a topic" do
    teacher = teachers(:teacher_alice)
    topic = Topic.create!(name: "Temp Topic", subject: subjects(:math))
    result = execute_query(
      mutation: DELETE_MUTATION,
      variables: { id: topic.id.to_s },
      user: teacher
    )
    data = result["data"]["deleteTopic"]
    assert data["success"]
  end

  test "parent cannot create a topic" do
    parent = parents(:parent_carol)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { input: { name: "Geometry", subjectId: subjects(:math).id.to_s } },
      user: parent
    )
    assert result["errors"].present?
  end

  test "unauthenticated user cannot create topic" do
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { input: { name: "Geometry", subjectId: subjects(:math).id.to_s } }
    )
    assert result["errors"].present?
  end
end
