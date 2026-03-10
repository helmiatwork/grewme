require "test_helper"

class StartExamMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($accessCode: String!, $studentId: ID!) {
      startExam(input: { accessCode: $accessCode, studentId: $studentId }) {
        examSubmission {
          id
          sessionToken
          status
          startedAt
          timeRemaining
        }
        errors { message path }
      }
    }
  GQL

  setup do
    @ce = classroom_exams(:alice_mc_exam)
    @ce.update!(status: :active, duration_minutes: 30)
    @student = students(:student_finn)
  end

  test "creates submission and returns session token" do
    result = GrewmeSchema.execute(MUTATION, variables: {
      accessCode: @ce.access_code, studentId: @student.id.to_s
    })
    data = result.dig("data", "startExam")

    assert_not_nil data
    assert_empty data["errors"]
    sub = data["examSubmission"]
    assert_not_nil sub["sessionToken"]
    assert_equal "IN_PROGRESS", sub["status"]
    assert_not_nil sub["startedAt"]
  end

  test "returns existing in-progress submission (rejoin)" do
    existing = ExamSubmission.create!(
      student: @student,
      classroom_exam: @ce,
      status: :in_progress,
      started_at: 5.minutes.ago
    )

    result = GrewmeSchema.execute(MUTATION, variables: {
      accessCode: @ce.access_code, studentId: @student.id.to_s
    })
    data = result.dig("data", "startExam", "examSubmission")

    assert_equal existing.id.to_s, data["id"]
  end

  test "rejects if student already submitted" do
    ExamSubmission.create!(
      student: @student,
      classroom_exam: @ce,
      status: :submitted,
      started_at: 30.minutes.ago,
      submitted_at: 5.minutes.ago
    )

    result = GrewmeSchema.execute(MUTATION, variables: {
      accessCode: @ce.access_code, studentId: @student.id.to_s
    })
    errors = result.dig("data", "startExam", "errors")
    assert_not_empty errors
  end

  test "rejects invalid access code" do
    result = GrewmeSchema.execute(MUTATION, variables: {
      accessCode: "BADCOD", studentId: @student.id.to_s
    })
    errors = result.dig("data", "startExam", "errors")
    assert_not_empty errors
  end
end
