# frozen_string_literal: true

class AuditLogger
  def self.log(event_type:, action:, user: nil, resource: nil, metadata: {}, severity: :info, request: nil)
    AuditLog.create!(
      event_type: event_type.to_s,
      severity: severity.to_s,
      user_id: user&.id,
      user_type: user&.class&.name,
      user_role: user.respond_to?(:role) ? user.role : user&.class&.name&.underscore,
      resource_type: resource&.class&.name,
      resource_id: resource&.id,
      action: action.to_s,
      metadata: metadata,
      ip_address: request&.remote_ip,
      user_agent: request&.user_agent
    )
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error("AuditLogger failed: #{e.message}")
    nil
  end
end
