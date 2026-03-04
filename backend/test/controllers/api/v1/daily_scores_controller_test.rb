require "test_helper"

class Api::V1::DailyScoresControllerTest < ActionDispatch::IntegrationTest
  test "teacher creates score for own student" do
    assert_difference "DailyScore.count", 1 do
      auth_post api_v1_daily_scores_path, user: teachers(:teacher_alice), params: {
        daily_score: {
          student_id: students(:student_emma).id,
          date: "2026-03-10",
          skill_category: "writing",
          score: 88,
          notes: "Great work"
        }
      }
    end
    assert_response :created
  end

  test "teacher cannot score other teacher student" do
    auth_post api_v1_daily_scores_path, user: teachers(:teacher_alice), params: {
      daily_score: {
        student_id: students(:student_grace).id,
        date: "2026-03-10",
        skill_category: "writing",
        score: 88
      }
    }
    assert_response :forbidden
  end

  test "invalid score rejected" do
    auth_post api_v1_daily_scores_path, user: teachers(:teacher_alice), params: {
      daily_score: {
        student_id: students(:student_emma).id,
        date: "2026-03-10",
        skill_category: "writing",
        score: 150
      }
    }
    assert_response :unprocessable_entity
  end

  test "teacher updates own score" do
    score = daily_scores(:emma_reading_day1)
    auth_put api_v1_daily_score_path(score), user: teachers(:teacher_alice), params: {
      daily_score: { score: 95, notes: "Updated" }
    }
    assert_response :ok
    score.reload
    assert_equal 95, score.score
  end

  test "teacher cannot update other teacher score" do
    score = daily_scores(:grace_reading_day1)
    auth_put api_v1_daily_score_path(score), user: teachers(:teacher_alice), params: {
      daily_score: { score: 50 }
    }
    assert_response :forbidden
  end
end
