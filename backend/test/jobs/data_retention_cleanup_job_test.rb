# frozen_string_literal: true

require "test_helper"

class DataRetentionCleanupJobTest < ActiveSupport::TestCase
  test "expires pending consents past their expiry date" do
    parent = parents(:parent_carol)
    student = students(:student_emma)

    # Create an expired pending consent
    consent = Consent.create!(
      parent: parent,
      student: student,
      consent_method: "email_plus",
      parent_email: parent.email,
      status: :pending,
      expires_at: 1.day.ago
    )

    DataRetentionCleanupJob.new.perform

    assert_equal "expired", consent.reload.status
  end

  test "does not expire pending consents that have not expired" do
    parent = parents(:parent_carol)
    student = students(:student_emma)

    consent = Consent.create!(
      parent: parent,
      student: student,
      consent_method: "email_plus",
      parent_email: parent.email,
      status: :pending,
      expires_at: 30.days.from_now
    )

    DataRetentionCleanupJob.new.perform

    assert_equal "pending", consent.reload.status
  end

  test "completes deletion requests past grace period" do
    parent = parents(:parent_carol)

    request = AccountDeletionRequest.create!(
      user_type: parent.class.name,
      user_id: parent.id,
      grace_period_ends_at: 1.day.ago
    )

    DataRetentionCleanupJob.new.perform

    assert_equal "completed", request.reload.status
    assert_not_nil request.completed_at
  end

  test "does not complete deletion requests still in grace period" do
    parent = parents(:parent_carol)

    request = AccountDeletionRequest.create!(
      user_type: parent.class.name,
      user_id: parent.id,
      grace_period_ends_at: 15.days.from_now
    )

    DataRetentionCleanupJob.new.perform

    assert_equal "pending", request.reload.status
  end
end
