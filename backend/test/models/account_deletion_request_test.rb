# frozen_string_literal: true

require "test_helper"

class AccountDeletionRequestTest < ActiveSupport::TestCase
  def build_request(overrides = {})
    parent = parents(:parent_carol)
    AccountDeletionRequest.new(
      { user_type: parent.class.name, user_id: parent.id }.merge(overrides)
    )
  end

  test "valid creation with grace period auto-set" do
    request = build_request
    assert request.valid?
    assert request.save
    assert_not_nil request.grace_period_ends_at
    assert_in_delta 30.days.from_now.to_i, request.grace_period_ends_at.to_i, 60
  end

  test "requires user_type" do
    request = build_request(user_type: nil)
    assert_not request.valid?
    assert_includes request.errors[:user_type], "can't be blank"
  end

  test "requires user_id" do
    request = build_request(user_id: nil)
    assert_not request.valid?
    assert_includes request.errors[:user_id], "can't be blank"
  end

  test "cancel! transitions to cancelled" do
    request = build_request
    request.save!
    request.cancel!
    assert_equal "cancelled", request.status
  end

  test "complete! transitions to completed with timestamp" do
    request = build_request
    request.save!
    request.complete!
    assert_equal "completed", request.status
    assert_not_nil request.completed_at
  end

  test "past_grace_period scope returns only past-grace pending requests" do
    parent = parents(:parent_carol)

    past = AccountDeletionRequest.create!(
      user_type: parent.class.name,
      user_id: parent.id,
      grace_period_ends_at: 1.day.ago
    )

    future = AccountDeletionRequest.create!(
      user_type: "Teacher",
      user_id: teachers(:teacher_alice).id,
      grace_period_ends_at: 10.days.from_now
    )

    scope = AccountDeletionRequest.past_grace_period
    assert_includes scope, past
    assert_not_includes scope, future
  end

  test "past_grace_period excludes completed requests" do
    parent = parents(:parent_carol)

    completed = AccountDeletionRequest.create!(
      user_type: parent.class.name,
      user_id: parent.id,
      grace_period_ends_at: 1.day.ago,
      status: :completed,
      completed_at: Time.current
    )

    assert_not_includes AccountDeletionRequest.past_grace_period, completed
  end
end
