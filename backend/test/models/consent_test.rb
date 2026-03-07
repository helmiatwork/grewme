# frozen_string_literal: true

require "test_helper"

class ConsentTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_emma)
    @parent = parents(:parent_carol)
  end

  test "valid consent" do
    consent = Consent.new(
      student: @student,
      parent_email: "parent@example.com",
      consent_method: "email_plus"
    )
    assert consent.valid?, consent.errors.full_messages.join(", ")
  end

  test "generates token automatically" do
    consent = Consent.create!(
      student: @student,
      parent_email: "parent@example.com",
      consent_method: "email_plus"
    )
    assert_not_nil consent.token
    assert consent.token.length > 20
  end

  test "sets expiry to 60 days" do
    consent = Consent.create!(
      student: @student,
      parent_email: "parent@example.com",
      consent_method: "email_plus"
    )
    assert_not_nil consent.expires_at
    assert consent.expires_at > 59.days.from_now
    assert consent.expires_at <= 61.days.from_now
  end

  test "requires parent_email" do
    consent = Consent.new(student: @student, consent_method: "email_plus")
    assert_not consent.valid?
    assert_includes consent.errors[:parent_email], "can't be blank"
  end

  test "validates parent_email format" do
    consent = Consent.new(student: @student, parent_email: "invalid", consent_method: "email_plus")
    assert_not consent.valid?
    assert_includes consent.errors[:parent_email], "is invalid"
  end

  test "validates consent_method inclusion" do
    consent = Consent.new(student: @student, parent_email: "p@example.com", consent_method: "phone")
    assert_not consent.valid?
    assert_includes consent.errors[:consent_method], "is not included in the list"
  end

  test "token uniqueness" do
    c1 = Consent.create!(student: @student, parent_email: "a@example.com", consent_method: "email_plus")
    c2 = Consent.new(student: @student, parent_email: "b@example.com", consent_method: "email_plus", token: c1.token)
    assert_not c2.valid?
  end

  test "default status is pending" do
    consent = Consent.create!(student: @student, parent_email: "p@example.com", consent_method: "email_plus")
    assert consent.pending?
  end

  test "grant! sets status and parent" do
    consent = Consent.create!(student: @student, parent_email: "p@example.com", consent_method: "email_plus")
    consent.grant!(parent: @parent, ip_address: "127.0.0.1")
    assert consent.granted?
    assert_equal @parent, consent.parent
    assert_not_nil consent.granted_at
    assert_equal "127.0.0.1", consent.ip_address.to_s
  end

  test "revoke! sets status and timestamp" do
    consent = Consent.create!(student: @student, parent_email: "p@example.com", consent_method: "email_plus")
    consent.grant!(parent: @parent)
    consent.revoke!
    assert consent.revoked?
    assert_not_nil consent.revoked_at
  end

  test "decline! sets status" do
    consent = Consent.create!(student: @student, parent_email: "p@example.com", consent_method: "email_plus")
    consent.decline!
    assert consent.declined?
  end

  test "active scope returns granted non-revoked" do
    active = Consent.create!(student: @student, parent_email: "active@example.com", consent_method: "email_plus")
    active.grant!(parent: @parent)

    student2 = students(:student_finn)
    revoked = Consent.create!(student: student2, parent_email: "revoked@example.com", consent_method: "email_plus")
    revoked.grant!(parent: @parent)
    revoked.revoke!

    results = Consent.active
    assert_includes results, active
    assert_not_includes results, revoked
  end

  test "pending_expired scope" do
    expired = Consent.create!(student: @student, parent_email: "exp@example.com", consent_method: "email_plus")
    expired.update_column(:expires_at, 1.day.ago)

    results = Consent.pending_expired
    assert_includes results, expired
  end

  test "unique student + parent_email" do
    Consent.create!(student: @student, parent_email: "unique@example.com", consent_method: "email_plus")
    duplicate = Consent.new(
      student: @student,
      parent_email: "unique@example.com",
      consent_method: "email_plus",
      token: SecureRandom.urlsafe_base64(32)
    )
    assert_raises(ActiveRecord::RecordNotUnique) { duplicate.save!(validate: false) }
  end
end
