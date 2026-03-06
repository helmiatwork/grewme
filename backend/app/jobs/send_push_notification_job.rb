# frozen_string_literal: true

class SendPushNotificationJob < ApplicationJob
  queue_as :notifications
  retry_on StandardError, wait: :exponentially_longer, attempts: 5
  discard_on ActiveRecord::RecordNotFound

  def perform(user_type, user_id, notification_id)
    user = user_type.constantize.find(user_id)
    notification = Notification.find(notification_id)
    devices = user.push_devices.active

    return if devices.empty?

    fcm_client = build_fcm_client
    return unless fcm_client

    devices.find_each do |device|
      send_to_device(fcm_client, device, notification)
    rescue => e
      Rails.logger.error("[FCM] Failed to send to device #{device.id}: #{e.message}")
      device.deactivate! if invalid_token_error?(e)
    end
  end

  private

  def build_fcm_client
    project_id = ENV.fetch("FIREBASE_PROJECT_ID") {
      Rails.application.credentials.dig(:firebase, :project_id)
    }
    credentials_json = ENV.fetch("FIREBASE_CREDENTIALS") {
      Rails.application.credentials.dig(:firebase, :credentials_json)
    }

    return nil unless project_id && credentials_json

    FCM.new(StringIO.new(credentials_json), project_id)
  end

  def send_to_device(fcm_client, device, notification)
    message = {
      token: device.token,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        notification_id: notification.id.to_s,
        notifiable_type: notification.notifiable_type,
        notifiable_id: notification.notifiable_id.to_s
      }
    }

    # Add platform-specific config
    case device.platform
    when "android"
      message[:android] = { priority: "high" }
    when "ios"
      message[:apns] = { payload: { aps: { sound: "default", badge: 1 } } }
    when "web"
      message[:webpush] = {
        notification: { icon: "/icon-192.png" }
      }
    end

    fcm_client.send_v1(message)
  end

  def invalid_token_error?(error)
    error.message.include?("UNREGISTERED") ||
      error.message.include?("INVALID_ARGUMENT") ||
      error.message.include?("NOT_FOUND")
  end
end
