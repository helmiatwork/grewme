# frozen_string_literal: true

require "test_helper"

class GradeExamSubmissionMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($input: GradeSubmissionInput!) {
      gradeExamSubmission(input: $input) {
        examSubmission { id status score passed teacherNotes }
        errors { message path }
      }
    }
  GQL

  test "teacher can grade with rubric scores" do
    teacher = teachers(:teacher_alice)
    ce = ClassroomExam.create!(
      exam: exams(:poetry_rubric_exam),
      classroom: classrooms(:alice_class),
      assigned_by: teacher,
      status: :active
    )
    submission = ExamSubmission.create!(
      student: students(:student_finn),
      classroom_exam: ce,
      status: :submitted,
      submitted_at: Time.current
    )

    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          examSubmissionId: submission.id.to_s,
          rubricScores: [
            { rubricCriteriaId: rubric_criteria(:creativity).id.to_s, score: 4, feedback: "Very creative" },
            { rubricCriteriaId: rubric_criteria(:accuracy).id.to_s, score: 3, feedback: "Some errors" }
          ],
          passed: true,
          teacherNotes: "Good effort overall"
        }
      },
      user: teacher
    )

    data = result["data"]["gradeExamSubmission"]
    assert_empty data["errors"]
    assert_equal "GRADED", data["examSubmission"]["status"]
    assert_equal 70.0, data["examSubmission"]["score"]  # (4+3)/(5+5) * 100
    assert data["examSubmission"]["passed"]
    assert_equal "Good effort overall", data["examSubmission"]["teacherNotes"]
  end

  test "teacher can grade pass/fail exam" do
    teacher = teachers(:teacher_alice)
    ce = ClassroomExam.create!(
      exam: exams(:algebra_pass_fail),
      classroom: classrooms(:alice_class),
      assigned_by: teacher,
      status: :active
    )
    submission = ExamSubmission.create!(
      student: students(:student_finn),
      classroom_exam: ce,
      status: :submitted,
      submitted_at: Time.current
    )

    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          examSubmissionId: submission.id.to_s,
          passed: false,
          teacherNotes: "Needs more practice"
        }
      },
      user: teacher
    )

    data = result["data"]["gradeExamSubmission"]
    assert_empty data["errors"]
    assert_equal "GRADED", data["examSubmission"]["status"]
    assert_not data["examSubmission"]["passed"]
  end

  test "unauthenticated user cannot grade" do
    submission = exam_submissions(:emma_fractions_quiz)
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: { examSubmissionId: submission.id.to_s, score: 90.0, passed: true }
      }
    )
    assert result["errors"].present?
  end

  test "teacher can grade a score-based submission" do
    teacher = teachers(:teacher_alice)
    submission = exam_submissions(:emma_fractions_quiz)

    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          examSubmissionId: submission.id.to_s,
          score: 92.5,
          passed: true,
          teacherNotes: "Excellent work!"
        }
      },
      user: teacher
    )

    data = result["data"]["gradeExamSubmission"]
    assert_empty data["errors"]
    assert_equal "GRADED", data["examSubmission"]["status"]
    assert_equal 92.5, data["examSubmission"]["score"]
    assert data["examSubmission"]["passed"]
    assert_equal "Excellent work!", data["examSubmission"]["teacherNotes"]
  end
end
