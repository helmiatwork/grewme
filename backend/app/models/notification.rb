# frozen_string_literal: true

class Notification < ApplicationRecord
  KINDS = %w[
    leave_request_created
    leave_request_reviewed
    teacher_leave_request_created
    teacher_leave_request_reviewed
    classroom_event_created
    feed_post_tagged
    feed_post_created
    exam_submitted
    exam_grading_complete
    new_message
    new_comment
    health_checkup_reminder
  ].freeze

  belongs_to :recipient, polymorphic: true
  belongs_to :notifiable, polymorphic: true

  validates :title, presence: true
  validates :body, presence: true
  validates :kind, inclusion: { in: KINDS }, allow_nil: true

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }

  after_commit :invalidate_unread_count

  def read?
    read_at.present?
  end

  def mark_as_read!
    update!(read_at: Time.current) unless read?
  end

  private

  def invalidate_unread_count
    Rails.cache.delete("unread_count/#{recipient_type}/#{recipient_id}")
  end
end
