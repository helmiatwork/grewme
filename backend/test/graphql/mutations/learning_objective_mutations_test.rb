# frozen_string_literal: true

require "test_helper"

class LearningObjectiveMutationsTest < ActiveSupport::TestCase
  CREATE_MUTATION = <<~GQL
    mutation($input: CreateLearningObjectiveInput!) {
      createLearningObjective(input: $input) {
        learningObjective { id name examPassThreshold dailyScoreThreshold position }
        errors { message path }
      }
    }
  GQL

  UPDATE_MUTATION = <<~GQL
    mutation($input: UpdateLearningObjectiveInput!) {
      updateLearningObjective(input: $input) {
        learningObjective { id name examPassThreshold dailyScoreThreshold }
        errors { message path }
      }
    }
  GQL

  DELETE_MUTATION = <<~GQL
    mutation($id: ID!) {
      deleteLearningObjective(id: $id) {
        success
        errors { message path }
      }
    }
  GQL

  test "teacher can create a learning objective with custom thresholds" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { input: { name: "Multiply fractions", topicId: topics(:fractions).id.to_s, examPassThreshold: 80, dailyScoreThreshold: 85 } },
      user: teacher
    )
    data = result["data"]["createLearningObjective"]
    assert_empty data["errors"]
    assert_equal "Multiply fractions", data["learningObjective"]["name"]
    assert_equal 80, data["learningObjective"]["examPassThreshold"]
    assert_equal 85, data["learningObjective"]["dailyScoreThreshold"]
  end

  test "creates with default thresholds when not specified" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { input: { name: "Divide fractions", topicId: topics(:fractions).id.to_s } },
      user: teacher
    )
    data = result["data"]["createLearningObjective"]
    assert_empty data["errors"]
    assert_equal 70, data["learningObjective"]["examPassThreshold"]
    assert_equal 75, data["learningObjective"]["dailyScoreThreshold"]
  end

  test "teacher can update thresholds" do
    teacher = teachers(:teacher_alice)
    obj = learning_objectives(:add_fractions)
    result = execute_query(
      mutation: UPDATE_MUTATION,
      variables: { input: { id: obj.id.to_s, examPassThreshold: 90, dailyScoreThreshold: 95 } },
      user: teacher
    )
    data = result["data"]["updateLearningObjective"]
    assert_empty data["errors"]
    assert_equal 90, data["learningObjective"]["examPassThreshold"]
    assert_equal 95, data["learningObjective"]["dailyScoreThreshold"]
  end

  test "teacher can delete a learning objective" do
    teacher = teachers(:teacher_alice)
    obj = LearningObjective.create!(name: "Temp Obj", topic: topics(:fractions))
    result = execute_query(
      mutation: DELETE_MUTATION,
      variables: { id: obj.id.to_s },
      user: teacher
    )
    data = result["data"]["deleteLearningObjective"]
    assert data["success"]
  end

  test "returns error for duplicate name in same topic" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { input: { name: "Add fractions with different denominators", topicId: topics(:fractions).id.to_s } },
      user: teacher
    )
    data = result["data"]["createLearningObjective"]
    assert_not_empty data["errors"]
  end

  test "parent cannot create learning objective" do
    parent = parents(:parent_carol)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { input: { name: "Test", topicId: topics(:fractions).id.to_s } },
      user: parent
    )
    assert result["errors"].present?
  end
end
