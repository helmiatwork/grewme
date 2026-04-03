require "test_helper"

class JwtDenylistTest < ActiveSupport::TestCase
  test "table name is jwt_denylist" do
    assert_equal "jwt_denylist", JwtDenylist.table_name
  end

  test "can create a denylist entry" do
    entry = JwtDenylist.create!(jti: SecureRandom.uuid, exp: 1.hour.from_now)
    assert entry.persisted?
  end
end
