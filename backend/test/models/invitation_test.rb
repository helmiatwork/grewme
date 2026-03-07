# frozen_string_literal: true

require "test_helper"

class InvitationTest < ActiveSupport::TestCase
  setup do
    @school = schools(:greenwood)
    @manager = school_managers(:manager_pat)
  end

  test "valid invitation" do
    invitation = Invitation.new(
      inviter: @manager,
      school: @school,
      email: "newteacher@example.com",
      role: "teacher"
    )
    assert invitation.valid?, invitation.errors.full_messages.join(", ")
  end

  test "generates token automatically" do
    invitation = Invitation.create!(
      inviter: @manager,
      school: @school,
      email: "newteacher@example.com",
      role: "teacher"
    )
    assert_not_nil invitation.token
    assert invitation.token.length > 20
  end

  test "sets expiry automatically" do
    invitation = Invitation.create!(
      inviter: @manager,
      school: @school,
      email: "newteacher@example.com",
      role: "teacher"
    )
    assert_not_nil invitation.expires_at
    assert invitation.expires_at > Time.current
    assert invitation.expires_at <= 8.days.from_now
  end

  test "requires email" do
    invitation = Invitation.new(inviter: @manager, school: @school, role: "teacher")
    assert_not invitation.valid?
    assert_includes invitation.errors[:email], "can't be blank"
  end

  test "validates email format" do
    invitation = Invitation.new(inviter: @manager, school: @school, email: "invalid", role: "teacher")
    assert_not invitation.valid?
    assert_includes invitation.errors[:email], "is invalid"
  end

  test "validates role inclusion" do
    invitation = Invitation.new(inviter: @manager, school: @school, email: "test@example.com", role: "admin")
    assert_not invitation.valid?
    assert_includes invitation.errors[:role], "is not included in the list"
  end

  test "token uniqueness" do
    inv1 = Invitation.create!(inviter: @manager, school: @school, email: "a@example.com", role: "teacher")
    inv2 = Invitation.new(inviter: @manager, school: @school, email: "b@example.com", role: "teacher", token: inv1.token)
    assert_not inv2.valid?
  end

  test "expired? returns true when past expiry" do
    invitation = Invitation.create!(inviter: @manager, school: @school, email: "test@example.com", role: "teacher")
    invitation.update_column(:expires_at, 1.day.ago)
    assert invitation.expired?
  end

  test "active scope returns only pending non-expired" do
    active = Invitation.create!(inviter: @manager, school: @school, email: "active@example.com", role: "teacher")
    expired = Invitation.create!(inviter: @manager, school: @school, email: "expired@example.com", role: "teacher")
    expired.update_column(:expires_at, 1.day.ago)

    results = Invitation.active
    assert_includes results, active
    assert_not_includes results, expired
  end

  test "accept! changes status" do
    invitation = Invitation.create!(inviter: @manager, school: @school, email: "test@example.com", role: "teacher")
    teacher = teachers(:teacher_alice)
    invitation.accept!(teacher)
    assert invitation.accepted?
    assert_not_nil invitation.accepted_at
  end
end
