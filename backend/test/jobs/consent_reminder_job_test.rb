# frozen_string_literal: true

require "test_helper"

class ConsentReminderJobTest < ActiveSupport::TestCase
  include ActionMailer::TestHelper

  test "sends reminder for old pending consents" do
    student = students(:student_emma)
    # Create an old pending consent (35 days ago)
    Consent.create!(
      student: student,
      parent_email: "reminder@test.com",
      consent_method: "email_plus",
      created_at: 35.days.ago
    )

    assert_enqueued_emails 1 do
      ConsentReminderJob.perform_now
    end
  end

  test "does not send reminder for recent consents" do
    student = students(:student_emma)
    # Create a recent pending consent (5 days ago)
    Consent.create!(
      student: student,
      parent_email: "recent@test.com",
      consent_method: "email_plus",
      created_at: 5.days.ago
    )

    assert_enqueued_emails 0 do
      ConsentReminderJob.perform_now
    end
  end

  test "does not send reminder for granted consents" do
    student = students(:student_emma)
    parent = parents(:parent_carol)
    consent = Consent.create!(
      student: student,
      parent_email: "granted@test.com",
      consent_method: "email_plus",
      created_at: 35.days.ago
    )
    consent.grant!(parent: parent)

    assert_enqueued_emails 0 do
      ConsentReminderJob.perform_now
    end
  end
end
