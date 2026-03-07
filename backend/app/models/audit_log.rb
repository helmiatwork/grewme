# frozen_string_literal: true

class AuditLog < ApplicationRecord
  SEVERITIES = %w[info warning critical].freeze
  EVENT_TYPES = %w[
    LOGIN_SUCCESS LOGIN_FAILURE LOGOUT TOKEN_REFRESH PASSWORD_CHANGE
    STUDENT_VIEW STUDENT_SCORES_VIEW RADAR_CHART_VIEW STUDENT_EXPORT CLASSROOM_OVERVIEW_VIEW
    SCORE_CREATE SCORE_UPDATE SCORE_DELETE STUDENT_CREATE STUDENT_UPDATE STUDENT_DELETE
    CONSENT_REQUESTED CONSENT_GRANTED CONSENT_DECLINED CONSENT_REVOKED CONSENT_EXPIRED
    ACCOUNT_CREATED ACCOUNT_UPDATED ACCOUNT_DELETION_REQUESTED ACCOUNT_DELETED INVITATION_SENT
    ACCESS_DENIED UNAUTHORIZED_DATA_ACCESS_ATTEMPT
  ].freeze

  validates :event_type, presence: true, inclusion: { in: EVENT_TYPES }
  validates :severity, presence: true, inclusion: { in: SEVERITIES }
  validates :action, presence: true

  scope :for_user, ->(user) { where(user_type: user.class.name, user_id: user.id) }
  scope :for_resource, ->(resource) { where(resource_type: resource.class.name, resource_id: resource.id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :critical, -> { where(severity: "critical") }
  scope :since, ->(time) { where("created_at >= ?", time) }
end
