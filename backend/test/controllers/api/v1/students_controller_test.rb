require "test_helper"

class Api::V1::StudentsControllerTest < ActionDispatch::IntegrationTest
  test "teacher sees student in their classroom" do
    auth_get api_v1_student_path(students(:student_emma)), user: users(:teacher_alice)
    assert_response :ok
    body = JSON.parse(response.body)
    assert_equal "Emma", body["student"]["name"]
  end

  test "teacher cannot see student in other classroom" do
    auth_get api_v1_student_path(students(:student_grace)), user: users(:teacher_alice)
    assert_response :forbidden
  end

  test "parent sees linked child" do
    auth_get api_v1_student_path(students(:student_emma)), user: users(:parent_carol)
    assert_response :ok
  end

  test "parent cannot see unlinked child" do
    auth_get api_v1_student_path(students(:student_grace)), user: users(:parent_carol)
    assert_response :forbidden
  end

  test "radar returns skill data" do
    auth_get radar_api_v1_student_path(students(:student_emma)), user: users(:teacher_alice)
    assert_response :ok
    body = JSON.parse(response.body)
    assert body.key?("radar")
  end

  test "progress returns weekly data" do
    auth_get progress_api_v1_student_path(students(:student_emma)), user: users(:teacher_alice)
    assert_response :ok
  end

  test "daily_scores returns score history" do
    auth_get api_v1_student_daily_scores_path(students(:student_emma)), user: users(:teacher_alice)
    assert_response :ok
    body = JSON.parse(response.body)
    assert body.key?("daily_scores")
  end
end
