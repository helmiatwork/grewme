# frozen_string_literal: true

require "test_helper"

class SubmitExamAnswersMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($input: SubmitAnswersInput!) {
      submitExamAnswers(input: $input) {
        examSubmission { id status score passed examAnswers { id correct pointsAwarded selectedAnswer } }
        errors { message path }
      }
    }
  GQL

  test "auto-grades MC exam correctly with all correct answers" do
    student = students(:student_finn)
    # Remove existing submission for this student/exam combo
    ExamSubmission.where(classroom_exam: classroom_exams(:alice_mc_exam)).delete_all

    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          classroomExamId: classroom_exams(:alice_mc_exam).id.to_s,
          answers: [
            { examQuestionId: exam_questions(:mc_q1).id.to_s, selectedAnswer: "B" },
            { examQuestionId: exam_questions(:mc_q2).id.to_s, selectedAnswer: "A" }
          ]
        }
      },
      user: student
    )

    data = result["data"]["submitExamAnswers"]
    assert_empty data["errors"]
    assert_equal "GRADED", data["examSubmission"]["status"]
    assert_equal 100.0, data["examSubmission"]["score"]
    assert data["examSubmission"]["passed"]
    assert_equal 2, data["examSubmission"]["examAnswers"].size
    assert data["examSubmission"]["examAnswers"].all? { |a| a["correct"] }
  end

  test "auto-grades MC exam with some wrong answers" do
    student = students(:student_finn)
    ExamSubmission.where(classroom_exam: classroom_exams(:alice_mc_exam)).delete_all

    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          classroomExamId: classroom_exams(:alice_mc_exam).id.to_s,
          answers: [
            { examQuestionId: exam_questions(:mc_q1).id.to_s, selectedAnswer: "B" },
            { examQuestionId: exam_questions(:mc_q2).id.to_s, selectedAnswer: "C" }
          ]
        }
      },
      user: student
    )

    data = result["data"]["submitExamAnswers"]
    assert_empty data["errors"]
    assert_equal "GRADED", data["examSubmission"]["status"]
    assert_equal 50.0, data["examSubmission"]["score"]

    answers = data["examSubmission"]["examAnswers"]
    correct_count = answers.count { |a| a["correct"] }
    assert_equal 1, correct_count
  end

  test "auto-grades MC exam with all wrong answers" do
    student = students(:student_finn)
    ExamSubmission.where(classroom_exam: classroom_exams(:alice_mc_exam)).delete_all

    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          classroomExamId: classroom_exams(:alice_mc_exam).id.to_s,
          answers: [
            { examQuestionId: exam_questions(:mc_q1).id.to_s, selectedAnswer: "D" },
            { examQuestionId: exam_questions(:mc_q2).id.to_s, selectedAnswer: "D" }
          ]
        }
      },
      user: student
    )

    data = result["data"]["submitExamAnswers"]
    assert_empty data["errors"]
    assert_equal 0.0, data["examSubmission"]["score"]
    assert_not data["examSubmission"]["passed"]
  end

  test "unauthenticated user cannot submit answers" do
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          classroomExamId: classroom_exams(:alice_mc_exam).id.to_s,
          answers: [
            { examQuestionId: exam_questions(:mc_q1).id.to_s, selectedAnswer: "B" }
          ]
        }
      }
    )
    assert result["errors"].present?
  end
end
