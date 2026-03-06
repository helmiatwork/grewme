class RefreshRadarSummaryJob < ApplicationJob
  queue_as :low

  limits_concurrency to: 1, key: -> { "radar-refresh" }

  def perform
    StudentRadarSummary.refresh
  end
end
