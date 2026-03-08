# frozen_string_literal: true

class DataRetentionCleanupJob < ApplicationJob
  queue_as :default

  def perform
    expire_pending_consents
    process_deletion_requests
    purge_old_audit_logs
  end

  private

  def expire_pending_consents
    Consent.pending_expired.find_each do |consent|
      consent.update!(status: :expired)
    end
  end

  def process_deletion_requests
    AccountDeletionRequest.past_grace_period.find_each do |request|
      user = request.user_type.constantize.find_by(id: request.user_id)
      if user
        # Anonymize rather than hard-delete to preserve referential integrity
        if user.respond_to?(:name=)
          user.update_columns(name: "Deleted User")
        end
        if user.respond_to?(:email=)
          user.update_columns(email: "deleted_#{request.user_id}@deleted.local")
        end
      end
      request.complete!

      AuditLogger.log(
        event_type: :ACCOUNT_DELETED,
        action: "account_deletion_completed",
        user: nil,
        resource: request,
        metadata: { user_type: request.user_type, user_id: request.user_id }
      )
    end
  end

  def purge_old_audit_logs
    # Keep audit logs for 7 years (FERPA requirement)
    AuditLog.where("created_at < ?", 7.years.ago).delete_all
  end
end
