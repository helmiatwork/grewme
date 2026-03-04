class RefreshRadarSummaryJob < ApplicationJob
  queue_as :default

  def perform
    StudentRadarSummary.refresh
  rescue => e
    Rails.logger.error("Failed to refresh radar summary: #{e.message}")
  end
end
