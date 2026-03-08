# frozen_string_literal: true

require "test_helper"

class AuditIntegrationTest < ActiveSupport::TestCase
  fixtures :all

  LOGIN_MUTATION = <<~GRAPHQL
    mutation($email: String!, $password: String!, $role: String!) {
      login(email: $email, password: $password, role: $role) {
        accessToken
        errors { message path }
      }
    }
  GRAPHQL

  CREATE_DAILY_SCORE_MUTATION = <<~GRAPHQL
    mutation($input: CreateDailyScoreInput!) {
      createDailyScore(input: $input) {
        dailyScore { id }
        errors { message path }
      }
    }
  GRAPHQL

  CREATE_INVITATION_MUTATION = <<~GRAPHQL
    mutation($email: String!, $role: String!) {
      createInvitation(email: $email, role: $role) {
        invitation { id }
        errors { message path }
      }
    }
  GRAPHQL

  REQUEST_CONSENT_MUTATION = <<~GRAPHQL
    mutation($input: RequestConsentInput!) {
      requestConsent(input: $input) {
        consent { id status }
        errors { message path }
      }
    }
  GRAPHQL

  AUDIT_LOGS_QUERY = <<~GRAPHQL
    query {
      auditLogs {
        id eventType action severity createdAt
      }
    }
  GRAPHQL

  test "login success creates LOGIN_SUCCESS audit log" do
    teacher = teachers(:teacher_alice)
    assert_difference "AuditLog.count", 1 do
      execute_query(
        mutation: LOGIN_MUTATION,
        variables: { email: teacher.email, password: "password123", role: "teacher" }
      )
    end
    log = AuditLog.last
    assert_equal "LOGIN_SUCCESS", log.event_type
    assert_equal teacher.id, log.user_id
    assert_equal "login", log.action
  end

  test "login failure creates LOGIN_FAILURE audit log" do
    teacher = teachers(:teacher_alice)
    assert_difference "AuditLog.count", 1 do
      execute_query(
        mutation: LOGIN_MUTATION,
        variables: { email: teacher.email, password: "wrongpassword", role: "teacher" }
      )
    end
    log = AuditLog.last
    assert_equal "LOGIN_FAILURE", log.event_type
    assert_equal "login_failed", log.action
    assert_equal "warning", log.severity
    assert_nil log.user_id
  end

  test "creating a daily score creates SCORE_CREATE audit log" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    assert_difference "AuditLog.count", 1 do
      execute_query(
        mutation: CREATE_DAILY_SCORE_MUTATION,
        variables: {
          input: {
            studentId: student.id.to_s,
            date: Date.today.iso8601,
            skillCategory: "READING",
            score: 80
          }
        },
        user: teacher
      )
    end
    log = AuditLog.last
    assert_equal "SCORE_CREATE", log.event_type
    assert_equal teacher.id, log.user_id
    assert_equal "create_daily_score", log.action
    assert_equal "DailyScore", log.resource_type
  end

  test "creating an invitation creates INVITATION_SENT audit log" do
    manager = school_managers(:manager_pat)
    assert_difference "AuditLog.count", 1 do
      execute_query(
        mutation: CREATE_INVITATION_MUTATION,
        variables: { email: "newteacher@school.com", role: "teacher" },
        user: manager
      )
    end
    log = AuditLog.last
    assert_equal "INVITATION_SENT", log.event_type
    assert_equal manager.id, log.user_id
    assert_equal "create_invitation", log.action
    assert_equal "newteacher@school.com", log.metadata["email"]
  end

  test "requesting consent creates CONSENT_REQUESTED audit log" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    assert_difference "AuditLog.count", 1 do
      execute_query(
        mutation: REQUEST_CONSENT_MUTATION,
        variables: {
          input: {
            studentId: student.id.to_s,
            parentEmail: "newparent@example.com"
          }
        },
        user: teacher
      )
    end
    log = AuditLog.last
    assert_equal "CONSENT_REQUESTED", log.event_type
    assert_equal teacher.id, log.user_id
    assert_equal "request_consent", log.action
    assert_equal "Consent", log.resource_type
  end

  test "school manager can query audit_logs" do
    manager = school_managers(:manager_pat)
    # Create a couple of logs first
    AuditLogger.log(event_type: :LOGIN_SUCCESS, action: "login", user: teachers(:teacher_alice))

    result = execute_query(
      query: AUDIT_LOGS_QUERY,
      user: manager
    )
    data = gql_data(result)
    assert_not_nil data["auditLogs"]
    assert data["auditLogs"].is_a?(Array)
    assert data["auditLogs"].length >= 1
  end

  test "non-manager cannot query audit_logs" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      query: AUDIT_LOGS_QUERY,
      user: teacher
    )
    assert result["errors"].present?
  end
end
