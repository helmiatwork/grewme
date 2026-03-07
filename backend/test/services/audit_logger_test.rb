# frozen_string_literal: true

require "test_helper"

class AuditLoggerTest < ActiveSupport::TestCase
  test "logs event with user and resource" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)

    assert_difference "AuditLog.count", 1 do
      AuditLogger.log(
        event_type: "STUDENT_VIEW",
        user: teacher,
        resource: student,
        action: "view",
        metadata: { fields: %w[name radar] }
      )
    end

    log = AuditLog.last
    assert_equal "STUDENT_VIEW", log.event_type
    assert_equal "Teacher", log.user_type
    assert_equal teacher.id, log.user_id
    assert_equal "Student", log.resource_type
    assert_equal student.id, log.resource_id
    assert_equal "view", log.action
    assert_equal %w[name radar], log.metadata["fields"]
  end

  test "logs event without user (system event)" do
    assert_difference "AuditLog.count", 1 do
      AuditLogger.log(
        event_type: "CONSENT_EXPIRED",
        action: "expire",
        metadata: { student_id: 1 }
      )
    end

    log = AuditLog.last
    assert_nil log.user_id
  end

  test "handles invalid event gracefully" do
    result = AuditLogger.log(
      event_type: "INVALID",
      action: "test"
    )
    assert_nil result
  end

  test "logs with severity" do
    AuditLogger.log(
      event_type: "ACCESS_DENIED",
      action: "denied",
      severity: :critical,
      user: teachers(:teacher_alice)
    )

    log = AuditLog.last
    assert_equal "critical", log.severity
  end
end
