require "test_helper"

class RefreshTokenTest < ActiveSupport::TestCase
  test "generates token digest on create" do
    token = users(:teacher_alice).refresh_tokens.create!
    assert_not_nil token.token_digest
    assert token.token_digest.length == 64  # SHA256 hex digest
  end

  test "raw_token is available after create" do
    token = users(:teacher_alice).refresh_tokens.create!
    assert_not_nil token.raw_token
    assert token.raw_token.length > 0
  end

  test "revoke sets revoked_at" do
    token = users(:teacher_alice).refresh_tokens.create!
    assert_nil token.revoked_at
    token.revoke!
    assert_not_nil token.revoked_at
  end

  test "expired returns true after expires_at" do
    token = users(:teacher_alice).refresh_tokens.create!(expires_at: 1.day.ago)
    assert token.expired?
  end

  test "active scope excludes revoked and expired" do
    active = users(:teacher_alice).refresh_tokens.create!
    revoked = users(:teacher_alice).refresh_tokens.create!
    revoked.revoke!
    expired = users(:teacher_alice).refresh_tokens.create!(expires_at: 1.day.ago)

    active_tokens = RefreshToken.active
    assert_includes active_tokens, active
    assert_not_includes active_tokens, revoked
    assert_not_includes active_tokens, expired
  end
end
