# frozen_string_literal: true

require "test_helper"

class StudentsQueryTest < ActiveSupport::TestCase
  STUDENT_QUERY = <<~GRAPHQL
    query($id: ID!) { student(id: $id) { id name } }
  GRAPHQL

  RADAR_QUERY = <<~GRAPHQL
    query($studentId: ID!) {
      studentRadar(studentId: $studentId) {
        studentId studentName
        skills { reading math writing logic social }
      }
    }
  GRAPHQL

  PROGRESS_QUERY = <<~GRAPHQL
    query($studentId: ID!) {
      studentProgress(studentId: $studentId) {
        weeks { period skills { reading math writing logic social } }
      }
    }
  GRAPHQL

  CHILDREN_QUERY = <<~GRAPHQL
    query { myChildren { id name } }
  GRAPHQL

  test "teacher can view their student" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    result = execute_query(query: STUDENT_QUERY, variables: { id: student.id.to_s }, user: teacher)

    assert_nil gql_errors(result)
    assert_equal "Emma", gql_data(result)["student"]["name"]
  end

  test "parent can view their child" do
    parent = parents(:parent_carol)
    student = students(:student_emma)
    result = execute_query(query: STUDENT_QUERY, variables: { id: student.id.to_s }, user: parent)

    assert_nil gql_errors(result)
    assert_equal "Emma", gql_data(result)["student"]["name"]
  end

  test "teacher cannot view student from another class" do
    teacher = teachers(:teacher_alice)
    student = students(:student_grace)
    result = execute_query(query: STUDENT_QUERY, variables: { id: student.id.to_s }, user: teacher)

    assert_not_nil gql_errors(result)
  end

  test "returns radar data" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    result = execute_query(query: RADAR_QUERY, variables: { studentId: student.id.to_s }, user: teacher)

    assert_nil gql_errors(result)
    radar = gql_data(result)["studentRadar"]
    assert_equal student.id.to_s, radar["studentId"]
    assert radar["skills"].key?("reading")
  end

  test "returns progress data with 5 weeks" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    result = execute_query(query: PROGRESS_QUERY, variables: { studentId: student.id.to_s }, user: teacher)

    assert_nil gql_errors(result)
    weeks = gql_data(result)["studentProgress"]["weeks"]
    assert_equal 5, weeks.length
  end

  test "parent can list children" do
    parent = parents(:parent_carol)
    result = execute_query(query: CHILDREN_QUERY, user: parent)

    assert_nil gql_errors(result)
    children = gql_data(result)["myChildren"]
    assert children.any? { |c| c["name"] == "Emma" }
  end

  test "teacher cannot list children" do
    teacher = teachers(:teacher_alice)
    result = execute_query(query: CHILDREN_QUERY, user: teacher)

    assert_not_nil gql_errors(result)
    assert_match "Only parents", gql_errors(result).first["message"]
  end

  test "errors when unauthenticated" do
    student = students(:student_emma)
    result = execute_query(query: STUDENT_QUERY, variables: { id: student.id.to_s })
    assert_not_nil gql_errors(result)
  end
end
