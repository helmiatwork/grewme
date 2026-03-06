# frozen_string_literal: true

require "test_helper"

class AssignExamToClassroomMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($input: AssignExamInput!) {
      assignExamToClassroom(input: $input) {
        classroomExam { id status scheduledAt dueAt exam { id title } classroom { id name } }
        errors { message path }
      }
    }
  GQL

  test "teacher can assign exam to classroom" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          examId: exams(:poetry_rubric_exam).id.to_s,
          classroomId: classrooms(:alice_class).id.to_s,
          scheduledAt: "2026-03-15T09:00:00Z",
          dueAt: "2026-03-15T10:00:00Z"
        }
      },
      user: teacher
    )
    data = result["data"]["assignExamToClassroom"]
    assert_empty data["errors"]
    assert_equal "ACTIVE", data["classroomExam"]["status"]
    assert_equal "Poetry Analysis", data["classroomExam"]["exam"]["title"]
  end

  test "cannot assign same exam to same classroom twice" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          examId: exams(:fractions_score_exam).id.to_s,
          classroomId: classrooms(:alice_class).id.to_s
        }
      },
      user: teacher
    )
    data = result["data"]["assignExamToClassroom"]
    assert_not_empty data["errors"]
  end

  test "can assign same exam to different classroom" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          examId: exams(:fractions_score_exam).id.to_s,
          classroomId: classrooms(:bob_class).id.to_s
        }
      },
      user: teacher
    )
    data = result["data"]["assignExamToClassroom"]
    assert_empty data["errors"]
  end

  test "unauthenticated user cannot assign exam" do
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          examId: exams(:fractions_score_exam).id.to_s,
          classroomId: classrooms(:bob_class).id.to_s
        }
      }
    )
    assert result["errors"].present?
  end
end
