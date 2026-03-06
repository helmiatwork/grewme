# frozen_string_literal: true

class NotificationService
  CABLE_PAYLOAD_KEYS = %i[id title body notifiable_type notifiable_id created_at].freeze

  def self.deliver(recipient, notification)
    new(recipient, notification).deliver
  end

  def initialize(recipient, notification)
    @recipient = recipient
    @notification = notification
  end

  def deliver
    broadcast_cable
    enqueue_push
  end

  private

  attr_reader :recipient, :notification

  def broadcast_cable
    NotificationsChannel.broadcast_to(recipient, {
      type: "new_notification",
      notification: cable_payload
    })
  end

  def cable_payload
    {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      notifiable_type: notification.notifiable_type,
      notifiable_id: notification.notifiable_id,
      created_at: notification.created_at.iso8601
    }
  end

  def enqueue_push
    return unless push_enabled?

    SendPushNotificationJob.perform_later(
      recipient.class.name,
      recipient.id,
      notification.id
    )
  end

  def push_enabled?
    Rails.application.credentials.dig(:firebase, :project_id).present? ||
      ENV["FIREBASE_PROJECT_ID"].present?
  end
end
