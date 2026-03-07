# frozen_string_literal: true

require "test_helper"

class AuditLogTest < ActiveSupport::TestCase
  test "valid audit log" do
    log = AuditLog.new(
      event_type: "STUDENT_VIEW",
      severity: "info",
      action: "view"
    )
    assert log.valid?, log.errors.full_messages.join(", ")
  end

  test "requires event_type" do
    log = AuditLog.new(severity: "info", action: "view")
    assert_not log.valid?
    assert_includes log.errors[:event_type], "can't be blank"
  end

  test "validates event_type inclusion" do
    log = AuditLog.new(event_type: "INVALID_EVENT", severity: "info", action: "view")
    assert_not log.valid?
    assert_includes log.errors[:event_type], "is not included in the list"
  end

  test "validates severity inclusion" do
    log = AuditLog.new(event_type: "STUDENT_VIEW", severity: "debug", action: "view")
    assert_not log.valid?
    assert_includes log.errors[:severity], "is not included in the list"
  end

  test "requires action" do
    log = AuditLog.new(event_type: "STUDENT_VIEW", severity: "info")
    assert_not log.valid?
    assert_includes log.errors[:action], "can't be blank"
  end

  test "for_user scope" do
    teacher = teachers(:teacher_alice)
    AuditLog.create!(event_type: "STUDENT_VIEW", severity: "info", action: "view", user_type: "Teacher", user_id: teacher.id)
    AuditLog.create!(event_type: "LOGIN_SUCCESS", severity: "info", action: "login", user_type: "Parent", user_id: 999)

    results = AuditLog.for_user(teacher)
    assert_equal 1, results.count
  end

  test "for_resource scope" do
    student = students(:student_emma)
    AuditLog.create!(event_type: "STUDENT_VIEW", severity: "info", action: "view", resource_type: "Student", resource_id: student.id)

    results = AuditLog.for_resource(student)
    assert_equal 1, results.count
  end

  test "critical scope" do
    AuditLog.create!(event_type: "ACCESS_DENIED", severity: "critical", action: "denied")
    AuditLog.create!(event_type: "STUDENT_VIEW", severity: "info", action: "view")

    assert_equal 1, AuditLog.critical.count
  end

  test "metadata stores JSON" do
    log = AuditLog.create!(
      event_type: "SCORE_CREATE",
      severity: "info",
      action: "create",
      metadata: { scores: { reading: 85, math: 90 }, date: "2026-03-07" }
    )
    log.reload
    assert_equal 85, log.metadata["scores"]["reading"]
  end
end
