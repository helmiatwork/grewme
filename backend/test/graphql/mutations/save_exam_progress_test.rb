require "test_helper"

class SaveExamProgressMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($sessionToken: String!, $answers: [SessionAnswerInput!]!) {
      saveExamProgress(input: { sessionToken: $sessionToken, answers: $answers }) {
        success
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
    @question = @ce.exam.exam_questions.first
  end

  test "saves answers for in-progress submission" do
    result = GrewmeSchema.execute(MUTATION, variables: {
      sessionToken: @submission.session_token,
      answers: [ { examQuestionId: @question.id.to_s, selectedAnswer: "A" } ]
    })
    data = result.dig("data", "saveExamProgress")

    assert data["success"]
    assert_equal 1, @submission.exam_answers.count
  end

  test "updates existing answers" do
    @submission.exam_answers.create!(exam_question: @question, selected_answer: "A")

    result = GrewmeSchema.execute(MUTATION, variables: {
      sessionToken: @submission.session_token,
      answers: [ { examQuestionId: @question.id.to_s, selectedAnswer: "B" } ]
    })

    assert result.dig("data", "saveExamProgress", "success")
    assert_equal "B", @submission.exam_answers.find_by(exam_question: @question).selected_answer
  end

  test "rejects invalid session token" do
    result = GrewmeSchema.execute(MUTATION, variables: {
      sessionToken: "invalid-token",
      answers: [ { examQuestionId: @question.id.to_s, selectedAnswer: "A" } ]
    })
    errors = result.dig("data", "saveExamProgress", "errors")
    assert_not_empty errors
  end
end
