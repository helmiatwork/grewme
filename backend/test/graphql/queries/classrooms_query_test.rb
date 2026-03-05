# frozen_string_literal: true

require "test_helper"

class ClassroomsQueryTest < ActiveSupport::TestCase
  CLASSROOMS_QUERY = <<~GRAPHQL
    query { classrooms { id name studentCount } }
  GRAPHQL

  CLASSROOM_QUERY = <<~GRAPHQL
    query($id: ID!) { classroom(id: $id) { id name students { id name } } }
  GRAPHQL

  OVERVIEW_QUERY = <<~GRAPHQL
    query($classroomId: ID!) {
      classroomOverview(classroomId: $classroomId) {
        classroomId classroomName
        students { studentId studentName skills { reading math } }
      }
    }
  GRAPHQL

  test "returns classrooms for teacher" do
    teacher = teachers(:teacher_alice)
    result = execute_query(query: CLASSROOMS_QUERY, user: teacher)

    assert_nil gql_errors(result)
    classrooms = gql_data(result)["classrooms"]
    assert_kind_of Array, classrooms
    assert classrooms.any? { |c| c["name"] == "Class 1A" }
  end

  test "returns single classroom" do
    teacher = teachers(:teacher_alice)
    classroom = classrooms(:alice_class)
    result = execute_query(query: CLASSROOM_QUERY, variables: { id: classroom.id.to_s }, user: teacher)

    assert_nil gql_errors(result)
    assert_equal "Class 1A", gql_data(result)["classroom"]["name"]
  end

  test "returns classroom overview" do
    teacher = teachers(:teacher_alice)
    classroom = classrooms(:alice_class)
    result = execute_query(query: OVERVIEW_QUERY, variables: { classroomId: classroom.id.to_s }, user: teacher)

    assert_nil gql_errors(result)
    overview = gql_data(result)["classroomOverview"]
    assert_equal "Class 1A", overview["classroomName"]
    assert_kind_of Array, overview["students"]
  end

  test "teacher cannot access another teachers classroom" do
    teacher = teachers(:teacher_alice)
    classroom = classrooms(:bob_class)
    result = execute_query(query: CLASSROOM_QUERY, variables: { id: classroom.id.to_s }, user: teacher)

    assert_not_nil gql_errors(result)
    assert_match "Not authorized", gql_errors(result).first["message"]
  end

  test "errors when unauthenticated" do
    result = execute_query(query: CLASSROOMS_QUERY)
    assert_not_nil gql_errors(result)
  end
end
