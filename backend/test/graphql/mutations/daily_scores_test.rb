# frozen_string_literal: true

require "test_helper"

class DailyScoresMutationTest < ActiveSupport::TestCase
  CREATE_MUTATION = <<~GRAPHQL
    mutation($input: CreateDailyScoreInput!) {
      createDailyScore(input: $input) {
        dailyScore { id score skillCategory date studentId }
        errors { message path }
      }
    }
  GRAPHQL

  UPDATE_MUTATION = <<~GRAPHQL
    mutation($id: ID!, $input: UpdateDailyScoreInput!) {
      updateDailyScore(id: $id, input: $input) {
        dailyScore { id score notes }
        errors { message path }
      }
    }
  GRAPHQL

  test "teacher creates daily score for their student" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: {
        input: {
          studentId: student.id.to_s,
          date: "2026-03-05",
          skillCategory: "WRITING",
          score: 88
        }
      },
      user: teacher
    )

    data = gql_data(result)["createDailyScore"]
    assert_empty data["errors"]
    assert_equal 88, data["dailyScore"]["score"]
    assert_equal "WRITING", data["dailyScore"]["skillCategory"]
  end

  test "returns errors for invalid score" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: {
        input: {
          studentId: student.id.to_s,
          date: "2026-03-05",
          skillCategory: "READING",
          score: 999
        }
      },
      user: teacher
    )

    data = gql_data(result)["createDailyScore"]
    assert_nil data["dailyScore"]
    assert_not_empty data["errors"]
  end

  test "teacher updates their own score" do
    teacher = teachers(:teacher_alice)
    score = daily_scores(:emma_reading_day1)
    result = execute_query(
      mutation: UPDATE_MUTATION,
      variables: {
        id: score.id.to_s,
        input: { score: 95, notes: "Updated" }
      },
      user: teacher
    )

    data = gql_data(result)["updateDailyScore"]
    assert_empty data["errors"]
    assert_equal 95, data["dailyScore"]["score"]
    assert_equal "Updated", data["dailyScore"]["notes"]
  end

  test "teacher cannot update another teachers score" do
    teacher = teachers(:teacher_alice)
    score = daily_scores(:grace_reading_day1)
    result = execute_query(
      mutation: UPDATE_MUTATION,
      variables: {
        id: score.id.to_s,
        input: { score: 50 }
      },
      user: teacher
    )

    assert_not_nil gql_errors(result)
    assert_match "Not authorized", gql_errors(result).first["message"]
  end

  test "errors when unauthenticated" do
    student = students(:student_emma)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: {
        input: {
          studentId: student.id.to_s,
          date: "2026-03-05",
          skillCategory: "READING",
          score: 85
        }
      }
    )

    assert_not_nil gql_errors(result)
  end
end
