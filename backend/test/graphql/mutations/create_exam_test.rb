# frozen_string_literal: true

require "test_helper"

class CreateExamMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($input: CreateExamInput!) {
      createExam(input: $input) {
        exam { id title examType examQuestions { id questionText correctAnswer } }
        errors { message path }
      }
    }
  GQL

  test "teacher can create MC exam with questions" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          title: "Algebra Quiz",
          examType: "MULTIPLE_CHOICE",
          topicId: topics(:algebra).id.to_s,
          maxScore: 10,
          questions: [
            { questionText: "What is x if 2x = 4?", correctAnswer: "2", points: 5 },
            { questionText: "What is x if x + 3 = 7?", correctAnswer: "4", points: 5 }
          ]
        }
      },
      user: teacher
    )

    data = result["data"]["createExam"]
    assert_empty data["errors"]
    assert_equal "Algebra Quiz", data["exam"]["title"]
    assert_equal "MULTIPLE_CHOICE", data["exam"]["examType"]
    assert_equal 2, data["exam"]["examQuestions"].size
  end

  test "teacher can create rubric exam with criteria" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: <<~GQL,
        mutation($input: CreateExamInput!) {
          createExam(input: $input) {
            exam { id title examType rubricCriteria { id name maxScore } }
            errors { message path }
          }
        }
      GQL
      variables: {
        input: {
          title: "Essay Rubric",
          examType: "RUBRIC",
          topicId: topics(:poetry).id.to_s,
          rubricCriteria: [
            { name: "Grammar", maxScore: 10 },
            { name: "Content", maxScore: 10 }
          ]
        }
      },
      user: teacher
    )
    data = result["data"]["createExam"]
    assert_empty data["errors"]
    assert_equal "RUBRIC", data["exam"]["examType"]
    assert_equal 2, data["exam"]["rubricCriteria"].size
  end

  test "teacher can create pass/fail exam" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          title: "Competency Check",
          examType: "PASS_FAIL",
          topicId: topics(:algebra).id.to_s
        }
      },
      user: teacher
    )
    data = result["data"]["createExam"]
    assert_empty data["errors"]
    assert_equal "PASS_FAIL", data["exam"]["examType"]
  end

  test "returns error for missing title" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          title: "",
          examType: "SCORE_BASED",
          topicId: topics(:fractions).id.to_s
        }
      },
      user: teacher
    )
    data = result["data"]["createExam"]
    assert_not_empty data["errors"]
  end

  test "parent cannot create exam" do
    parent = parents(:parent_carol)
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          title: "Test",
          examType: "SCORE_BASED",
          topicId: topics(:fractions).id.to_s
        }
      },
      user: parent
    )
    assert result["errors"].present?
  end

  test "teacher can create score-based exam" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: {
          title: "Math Final",
          examType: "SCORE_BASED",
          topicId: topics(:fractions).id.to_s,
          maxScore: 100
        }
      },
      user: teacher
    )

    data = result["data"]["createExam"]
    assert_empty data["errors"]
    assert_equal "Math Final", data["exam"]["title"]
  end
end
