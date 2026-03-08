# frozen_string_literal: true

class ConsentExpiryJob < ApplicationJob
  queue_as :default

  def perform
    Consent.pending_expired.find_each do |consent|
      consent.update!(status: :expired)

      AuditLogger.log(
        event_type: :CONSENT_EXPIRED,
        action: "consent_expired",
        resource: consent,
        metadata: { parent_email: consent.parent_email, student_id: consent.student_id }
      )
    end
  end
end
