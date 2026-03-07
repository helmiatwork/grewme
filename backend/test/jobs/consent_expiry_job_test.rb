# frozen_string_literal: true

require "test_helper"

class ConsentExpiryJobTest < ActiveSupport::TestCase
  test "expires pending consents past expiry date" do
    student = students(:student_emma)
    consent = Consent.create!(
      student: student,
      parent_email: "expired@test.com",
      consent_method: "email_plus",
      expires_at: 1.day.ago
    )

    ConsentExpiryJob.perform_now

    consent.reload
    assert consent.expired?
  end

  test "creates audit log for expired consent" do
    student = students(:student_emma)
    Consent.create!(
      student: student,
      parent_email: "audit@test.com",
      consent_method: "email_plus",
      expires_at: 1.day.ago
    )

    assert_difference "AuditLog.count", 1 do
      ConsentExpiryJob.perform_now
    end

    log = AuditLog.last
    assert_equal "CONSENT_EXPIRED", log.event_type
  end

  test "does not expire non-expired consents" do
    student = students(:student_emma)
    consent = Consent.create!(
      student: student,
      parent_email: "valid@test.com",
      consent_method: "email_plus"
      # expires_at defaults to 60 days from now
    )

    ConsentExpiryJob.perform_now

    consent.reload
    assert consent.pending?
  end
end
