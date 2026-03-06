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
