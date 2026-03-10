require "test_helper"

class ExamSessionQueryTest < ActiveSupport::TestCase
  QUERY = <<~GQL
    query($sessionToken: String!) {
      examSession(sessionToken: $sessionToken) {
        id
        status
        startedAt
        timeRemaining
        examAnswers {
          examQuestion { id }
          selectedAnswer
        }
      }
    }
  GQL

  setup do
    @ce = classroom_exams(:alice_mc_exam)
    @ce.update!(status: :active, duration_minutes: 30)
    @submission = ExamSubmission.create!(
      student: students(:student_finn),
      classroom_exam: @ce,
      status: :in_progress,
      started_at: 5.minutes.ago
    )
  end

  test "returns submission with answers for valid token" do
    result = GrewmeSchema.execute(QUERY, variables: { sessionToken: @submission.session_token })
    data = result.dig("data", "examSession")

    assert_not_nil data
    assert_equal "IN_PROGRESS", data["status"]
    assert_not_nil data["timeRemaining"]
  end

  test "returns null for invalid token" do
    result = GrewmeSchema.execute(QUERY, variables: { sessionToken: "bad-token" })
    assert_nil result.dig("data", "examSession")
  end

  test "returns null for already-submitted session" do
    @submission.update!(status: :submitted, submitted_at: Time.current)

    result = GrewmeSchema.execute(QUERY, variables: { sessionToken: @submission.session_token })
    assert_nil result.dig("data", "examSession")
  end
end
