# frozen_string_literal: true

class ConsentReminderJob < ApplicationJob
  queue_as :default

  def perform
    # Find pending consents older than 30 days but not expired
    Consent.pending
      .where("created_at < ?", 30.days.ago)
      .where("expires_at > ?", Time.current)
      .find_each do |consent|
      ConsentMailer.consent_reminder(consent).deliver_later
    end
  end
end
