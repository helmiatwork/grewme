require "test_helper"

class Api::V1::ClassroomsControllerTest < ActionDispatch::IntegrationTest
  test "teacher sees only their classrooms" do
    auth_get api_v1_classrooms_path, user: teachers(:teacher_alice)
    assert_response :ok
    body = JSON.parse(response.body)
    classrooms = body["classrooms"]
    assert_equal 1, classrooms.length
    assert_equal classrooms(:alice_class).id, classrooms[0]["id"]
  end

  test "teacher can see own classroom detail" do
    auth_get api_v1_classroom_path(classrooms(:alice_class)), user: teachers(:teacher_alice)
    assert_response :ok
    body = JSON.parse(response.body)
    assert_equal "Class 1A", body["classroom"]["name"]
  end

  test "teacher cannot see other teacher classroom" do
    auth_get api_v1_classroom_path(classrooms(:bob_class)), user: teachers(:teacher_alice)
    assert_response :forbidden
  end

  test "parent sees empty classrooms list" do
    auth_get api_v1_classrooms_path, user: parents(:parent_carol)
    assert_response :ok
    body = JSON.parse(response.body)
    assert_equal 0, body["classrooms"].length
  end

  test "classroom students returns correct students" do
    auth_get api_v1_classroom_students_path(classrooms(:alice_class)), user: teachers(:teacher_alice)
    assert_response :ok
    body = JSON.parse(response.body)
    student_names = body["students"].map { |s| s["name"] }
    assert_includes student_names, "Emma"
    assert_includes student_names, "Finn"
  end

  test "unauthenticated returns 401" do
    get api_v1_classrooms_path
    assert_response :unauthorized
  end
end
