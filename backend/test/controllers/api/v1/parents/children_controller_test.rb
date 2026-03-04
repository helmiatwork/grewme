require "test_helper"

class Api::V1::Parents::ChildrenControllerTest < ActionDispatch::IntegrationTest
  test "parent sees their children" do
    auth_get api_v1_parents_children_path, user: users(:parent_carol)
    assert_response :ok
    body = JSON.parse(response.body)
    student_names = body["students"].map { |s| s["name"] }
    assert_includes student_names, "Emma"
  end

  test "teacher cannot access parent children endpoint" do
    auth_get api_v1_parents_children_path, user: users(:teacher_alice)
    assert_response :forbidden
  end
end
