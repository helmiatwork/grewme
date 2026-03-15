require "test_helper"

class BehaviorCategoriesMutationTest < ActiveSupport::TestCase
  CREATE_MUTATION = <<~GRAPHQL
    mutation($schoolId: ID!, $name: String!, $pointValue: Int!, $icon: String!, $color: String!) {
      createBehaviorCategory(schoolId: $schoolId, name: $name, pointValue: $pointValue, icon: $icon, color: $color) {
        behaviorCategory { id name pointValue isPositive icon color position }
        errors { message path }
      }
    }
  GRAPHQL

  UPDATE_MUTATION = <<~GRAPHQL
    mutation($id: ID!, $name: String, $pointValue: Int) {
      updateBehaviorCategory(id: $id, name: $name, pointValue: $pointValue) {
        behaviorCategory { id name pointValue }
        errors { message path }
      }
    }
  GRAPHQL

  DELETE_MUTATION = <<~GRAPHQL
    mutation($id: ID!) {
      deleteBehaviorCategory(id: $id) {
        success
        errors { message path }
      }
    }
  GRAPHQL

  test "school manager creates behavior category" do
    sm = school_managers(:manager_pat)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { schoolId: schools(:greenwood).id.to_s, name: "Focus", pointValue: 2, icon: "🎯", color: "#10b981" },
      user: sm
    )
    data = gql_data(result)["createBehaviorCategory"]
    assert_empty data["errors"]
    assert_equal "Focus", data["behaviorCategory"]["name"]
    assert_equal 2, data["behaviorCategory"]["pointValue"]
    assert data["behaviorCategory"]["isPositive"]
  end

  test "teacher cannot create behavior category" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { schoolId: schools(:greenwood).id.to_s, name: "Focus", pointValue: 2, icon: "🎯", color: "#10b981" },
      user: teacher
    )
    assert_not_nil gql_errors(result)
  end

  test "school manager updates behavior category" do
    sm = school_managers(:manager_pat)
    cat = behavior_categories(:helping_others)
    result = execute_query(
      mutation: UPDATE_MUTATION,
      variables: { id: cat.id.to_s, name: "Helping Friends", pointValue: 4 },
      user: sm
    )
    data = gql_data(result)["updateBehaviorCategory"]
    assert_empty data["errors"]
    assert_equal "Helping Friends", data["behaviorCategory"]["name"]
    assert_equal 4, data["behaviorCategory"]["pointValue"]
  end

  test "school manager soft-deletes behavior category" do
    sm = school_managers(:manager_pat)
    cat = behavior_categories(:late_behavior)
    result = execute_query(
      mutation: DELETE_MUTATION,
      variables: { id: cat.id.to_s },
      user: sm
    )
    data = gql_data(result)["deleteBehaviorCategory"]
    assert data["success"]
    assert_not_nil cat.reload.deleted_at
  end

  test "unauthenticated user cannot create" do
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: { schoolId: schools(:greenwood).id.to_s, name: "X", pointValue: 1, icon: "✨", color: "#000000" }
    )
    assert_not_nil gql_errors(result)
  end
end
