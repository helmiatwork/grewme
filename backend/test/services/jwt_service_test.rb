require "test_helper"

class JwtServiceTest < ActiveSupport::TestCase
  test "encode returns a JWT string" do
    token = JwtService.encode({ user_id: 1 })
    assert_kind_of String, token
    assert token.start_with?("ey")
  end

  test "decode returns payload with user_id" do
    token = JwtService.encode({ user_id: 42 })
    payload = JwtService.decode(token)
    assert_equal 42, payload[:user_id]
  end

  test "encode includes jti and iat claims" do
    token = JwtService.encode({ user_id: 1 })
    payload = JwtService.decode(token)
    assert_not_nil payload[:jti]
    assert_match(/\A[0-9a-f-]{36}\z/, payload[:jti])
    assert_kind_of Integer, payload[:iat]
  end

  test "decode returns nil for expired token" do
    token = JwtService.encode({ user_id: 1 }, exp: 1.second.ago)
    payload = JwtService.decode(token)
    assert_nil payload
  end

  test "decode returns nil for tampered token" do
    token = JwtService.encode({ user_id: 1 })
    tampered = token[0..-2] + ((token[-1] == "a") ? "b" : "a")
    payload = JwtService.decode(tampered)
    assert_nil payload
  end

  test "decode returns nil for nil input" do
    assert_nil JwtService.decode(nil)
  end

  test "decode returns nil for empty string" do
    assert_nil JwtService.decode("")
  end

  test "token_revoked returns false for non-revoked jti" do
    assert_not JwtService.token_revoked?("some-random-jti")
  end

  test "token_revoked returns true after revocation" do
    jti = SecureRandom.uuid
    exp = 1.hour.from_now.to_i
    JwtService.revoke_access_token(jti, exp)
    assert JwtService.token_revoked?(jti)
  end
end
