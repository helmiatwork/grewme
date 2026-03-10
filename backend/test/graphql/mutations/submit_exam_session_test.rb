require "test_helper"

class SubmitExamSessionMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($sessionToken: String!) {
      submitExamSession(input: { sessionToken: $sessionToken }) {
        examSubmission {
          id
          status
          score
          submittedAt
        }
        errors { message path }
      }
    }
  GQL

  setup do
    @ce = classroom_exams(:alice_mc_exam)
    @ce.update!(status: :active, duration_minutes: 30)
    @student = students(:student_finn)
    @submission = ExamSubmission.create!(
      student: @student,
      classroom_exam: @ce,
      status: :in_progress,
      started_at: 5.minutes.ago
    )
    @ce.exam.exam_questions.each do |q|
      @submission.exam_answers.create!(
        exam_question: q,
        selected_answer: q.correct_answer
      )
    end
  end

  test "submits and auto-grades MC exam" do
    result = GrewmeSchema.execute(MUTATION, variables: {
      sessionToken: @submission.session_token
    })
    data = result.dig("data", "submitExamSession", "examSubmission")

    assert_equal "GRADED", data["status"]
    assert_equal 100.0, data["score"]
    assert_not_nil data["submittedAt"]
  end

  test "rejects already-submitted exam" do
    @submission.update!(status: :submitted, submitted_at: Time.current)

    result = GrewmeSchema.execute(MUTATION, variables: {
      sessionToken: @submission.session_token
    })
    errors = result.dig("data", "submitExamSession", "errors")
    assert_not_empty errors
  end
end
